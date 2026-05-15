const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const User = require("../models/User");
const {
  getActivePlan,
  getPaymentMethod,
  ensureBillingDefaults,
} = require("../services/planService");
const {
  activateSubscriptionFromPayment,
  createIdempotencyKey,
  createOrderId,
} = require("../services/paymentService");
const { getPaymentUrl, verifyPayhereNotification } = require("../utils/payhere");
const { uploadPaymentProof } = require("../services/storageService");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PAYHERE_MERCHANT_API_BASE =
  process.env.PAYHERE_MERCHANT_API_BASE ||
  (process.env.NODE_ENV === "production"
    ? "https://www.payhere.lk"
    : "https://sandbox.payhere.lk");

function normalizePaymentStatus(statusCode) {
  switch (String(statusCode)) {
    case "2":
      return "success";
    case "0":
      return "pending";
    case "-1":
      return "cancelled";
    case "-2":
      return "failed";
    case "-3":
      return "chargeback";
    default:
      return "failed";
  }
}

function sanitizePayherePayload(payload) {
  const allowedKeys = [
    "merchant_id",
    "order_id",
    "payment_id",
    "payhere_amount",
    "payhere_currency",
    "status_code",
    "status_message",
    "custom_1",
    "custom_2",
    "method",
  ];

  return allowedKeys.reduce((acc, key) => {
    if (payload[key] !== undefined) acc[key] = payload[key];
    return acc;
  }, {});
}

function buildRedirectPath(payment, status) {
  const landlordId = payment?.metadata?.landlordId || payment?.userId;
  const path = landlordId ? `/landlord/${landlordId}/pricing` : "/landlord/pricing";

  const params = new URLSearchParams();
  params.set("payment", status);
  if (payment?.providerOrderId) params.set("order", payment.providerOrderId);

  return `${FRONTEND_URL}${path}?${params.toString()}`;
}

async function getCurrentSubscription(userId) {
  const subscription = await Subscription.findOne({ userId })
    .populate("planId")
    .populate("latestPaymentId");

  if (!subscription) return { planType: "free" };

  const now = new Date();
  const endDate = subscription.currentPeriodEnd || subscription.nextBillingDate;
  const expired = endDate ? now > new Date(endDate) : false;
  const daysUntilExpiration =
    endDate && !expired
      ? Math.ceil((new Date(endDate) - now) / (1000 * 60 * 60 * 24))
      : 0;

  return {
    ...subscription.toObject(),
    planType: expired ? "free" : subscription.planType || "free",
    expired,
    daysUntilExpiration,
  };
}

async function requestPayhereRefund(payment, { amount, reason }) {
  const appId = process.env.PAYHERE_APP_ID;
  const appSecret = process.env.PAYHERE_APP_SECRET;

  if (!appId || !appSecret || typeof fetch !== "function") {
    return {
      attempted: false,
      status: "requested",
      error: "PayHere refund API credentials are not configured.",
    };
  }

  const basicToken = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const tokenResponse = await fetch(
    `${PAYHERE_MERCHANT_API_BASE}/merchant/v1/oauth/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  if (!tokenResponse.ok) {
    return {
      attempted: true,
      status: "failed",
      error: "Unable to retrieve PayHere access token.",
    };
  }

  const tokenData = await tokenResponse.json();
  const refundPayload = {
    payment_id: payment.providerPaymentId,
    description: reason || "LankaNest admin refund",
  };
  if (amount && Number(amount) < Number(payment.amount)) {
    refundPayload.amount = Number(amount).toFixed(2);
  }

  const refundResponse = await fetch(
    `${PAYHERE_MERCHANT_API_BASE}/merchant/v1/payment/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundPayload),
    }
  );

  const refundData = await refundResponse.json().catch(() => ({}));
  if (refundResponse.ok && refundData.status === 1) {
    return {
      attempted: true,
      status: "success",
      providerRefundId: String(refundData.data || ""),
    };
  }

  return {
    attempted: true,
    status: "failed",
    error: refundData.msg || "PayHere refund failed.",
  };
}

exports.createPayhereSubscriptionOrder = async (req, res) => {
  try {
    await ensureBillingDefaults();

    const userId = req.userId;
    const { planCode = "premium", landlordId } = req.body || {};
    const [user, plan, method] = await Promise.all([
      User.findById(userId),
      getActivePlan(planCode),
      getPaymentMethod("payhere"),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!plan || plan.code === "free") {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    if (!method?.enabled) {
      return res.status(403).json({
        success: false,
        message: "PayHere payments are currently disabled",
      });
    }

    const currentSubscription = await Subscription.findOne({ userId });
    const type =
      currentSubscription?.planType === "premium" &&
      currentSubscription?.currentPeriodEnd > new Date()
        ? "renewal"
        : "subscription";

    const payment = await Payment.create({
      userId,
      planId: plan._id,
      provider: "payhere",
      type,
      amount: plan.price.amount,
      currency: plan.price.currency,
      status: "pending",
      providerOrderId: createOrderId(),
      idempotencyKey: createIdempotencyKey("payhere"),
      metadata: {
        landlordId: landlordId || userId,
        planCode: plan.code,
      },
    });

    const checkout = getPaymentUrl(
      payment.providerOrderId,
      {
        firstName: user.username || "LankaNest",
        lastName: "",
        email: user.email,
        phone: user.phoneNumber || "0770000000",
      },
      payment.amount,
      { landlordId: landlordId || userId }
    );

    res.status(201).json({
      success: true,
      payment,
      checkoutUrl: checkout.checkoutUrl,
      formData: checkout.formData,
    });
  } catch (error) {
    console.error("Error creating PayHere order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate payment",
    });
  }
};

exports.handlePayhereNotify = async (req, res) => {
  const payload = req.body || {};
  let payment = null;
  let event = null;

  try {
    const signatureValid = verifyPayhereNotification(payload);
    payment = await Payment.findOne({ providerOrderId: payload.order_id });

    event = await PaymentEvent.create({
      paymentId: payment?._id,
      provider: "payhere",
      eventType: "payment_notification",
      providerEventId: payload.payment_id,
      signatureValid,
      payload: sanitizePayherePayload(payload),
    });

    if (!payment) {
      event.error = "Payment order was not found";
      await event.save();
      return res.status(200).send("OK");
    }

    if (!signatureValid) {
      payment.status = "flagged";
      payment.metadata = {
        ...payment.metadata,
        lastGatewayError: "Invalid PayHere md5 signature",
      };
      event.error = "Invalid PayHere md5 signature";
      await Promise.all([payment.save(), event.save()]);
      return res.status(200).send("OK");
    }

    const expectedAmount = Number(payment.amount).toFixed(2);
    const amountMatches = String(payload.payhere_amount) === expectedAmount;
    const currencyMatches =
      String(payload.payhere_currency || "").toUpperCase() === payment.currency;

    if (!amountMatches || !currencyMatches) {
      payment.status = "flagged";
      payment.metadata = {
        ...payment.metadata,
        expectedAmount,
        receivedAmount: payload.payhere_amount,
        expectedCurrency: payment.currency,
        receivedCurrency: payload.payhere_currency,
      };
      event.error = "Amount or currency mismatch";
      await Promise.all([payment.save(), event.save()]);
      return res.status(200).send("OK");
    }

    const nextStatus = normalizePaymentStatus(payload.status_code);
    const alreadyActivated = payment.status === "success";

    payment.providerPaymentId = payload.payment_id;
    payment.gatewayStatusCode = String(payload.status_code);
    payment.status = nextStatus;
    payment.metadata = {
      ...payment.metadata,
      method: payload.method,
      statusMessage: payload.status_message,
    };

    await payment.save();

    if (nextStatus === "success" && !alreadyActivated) {
      const plan = await Plan.findById(payment.planId);
      await activateSubscriptionFromPayment(payment, plan);
    }

    event.processed = true;
    await event.save();

    res.status(200).send("OK");
  } catch (error) {
    console.error("PayHere notification processing error:", error);
    if (event) {
      event.error = error.message;
      await event.save().catch(() => {});
    }
    res.status(200).send("OK");
  }
};

exports.handlePayhereReturn = async (req, res) => {
  const payment = await Payment.findOne({ providerOrderId: req.query.order_id });
  res.redirect(buildRedirectPath(payment, "return"));
};

exports.handlePayhereCancel = async (req, res) => {
  const payment = await Payment.findOne({ providerOrderId: req.query.order_id });
  if (payment && payment.status === "pending") {
    payment.status = "cancelled";
    await payment.save();
  }
  res.redirect(buildRedirectPath(payment, "cancelled"));
};

exports.createManualPayment = async (req, res) => {
  try {
    await ensureBillingDefaults();

    const userId = req.userId;
    const { planCode = "premium", notes = "" } = req.body || {};
    const [plan, method] = await Promise.all([
      getActivePlan(planCode),
      getPaymentMethod("manual"),
    ]);

    if (!plan || plan.code === "free") {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    if (!method?.enabled) {
      return res.status(403).json({
        success: false,
        message: "Manual payments are currently disabled",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt upload is required",
      });
    }

    const proof = await uploadPaymentProof(req.file);

    const payment = await Payment.create({
      userId,
      planId: plan._id,
      provider: "manual",
      type: "manual_subscription",
      amount: plan.price.amount,
      currency: plan.price.currency,
      status: "pending",
      idempotencyKey: createIdempotencyKey("manual"),
      manualProof: {
        filename: proof.key,
        originalName: req.file.originalname,
        storageKey: proof.key,
        bucket: proof.bucket,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
        notes,
      },
      adminReview: { status: "pending" },
      metadata: { planCode: plan.code },
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    console.error("Manual payment creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit manual payment",
    });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.userId })
      .populate("planId")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, payments });
  } catch (error) {
    console.error("Error loading user payments:", error);
    res.status(500).json({ success: false, message: "Failed to load payments" });
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await getCurrentSubscription(req.userId);
    res.json({ success: true, subscription });
  } catch (error) {
    console.error("Error loading subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load subscription",
    });
  }
};

exports.adminListPayments = async (req, res) => {
  try {
    const { status, provider } = req.query;
    const query = {};
    if (status && status !== "all") query.status = status;
    if (provider && provider !== "all") query.provider = provider;

    const payments = await Payment.find(query)
      .populate("userId", "username email role")
      .populate("planId")
      .populate("subscriptionId")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, payments });
  } catch (error) {
    console.error("Error loading admin payments:", error);
    res.status(500).json({ success: false, message: "Failed to load payments" });
  }
};

exports.adminFlagPayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: "flagged",
        "adminReview.reason": req.body.reason || "Flagged by admin",
        "adminReview.reviewedBy": req.admin._id,
        "adminReview.reviewedAt": new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Error flagging payment:", error);
    res.status(500).json({ success: false, message: "Failed to flag payment" });
  }
};

exports.adminApproveManualPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment || payment.provider !== "manual") {
      return res.status(404).json({
        success: false,
        message: "Manual payment not found",
      });
    }

    if (payment.status === "success") {
      return res.json({ success: true, payment });
    }

    const plan = await Plan.findById(payment.planId);
    payment.status = "success";
    payment.adminReview = {
      status: "approved",
      reviewedBy: req.admin._id,
      reviewedAt: new Date(),
      reason: req.body.reason || "",
    };

    await payment.save();
    await activateSubscriptionFromPayment(payment, plan);

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Error approving manual payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve manual payment",
    });
  }
};

exports.adminRejectManualPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment || payment.provider !== "manual") {
      return res.status(404).json({
        success: false,
        message: "Manual payment not found",
      });
    }

    payment.status = "rejected";
    payment.adminReview = {
      status: "rejected",
      reviewedBy: req.admin._id,
      reviewedAt: new Date(),
      reason: req.body.reason || "Rejected by admin",
    };
    await payment.save();

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Error rejecting manual payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject manual payment",
    });
  }
};

exports.adminRefundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const refundAmount = Number(req.body.amount || payment.amount);
    const refundReason = req.body.reason || "Admin requested refund";
    let refundResult = {
      status: "requested",
      error: "Manual refund tracking only.",
    };

    if (payment.provider === "payhere" && payment.providerPaymentId) {
      refundResult = await requestPayhereRefund(payment, {
        amount: refundAmount,
        reason: refundReason,
      });
    }

    payment.refund = {
      status: refundResult.status,
      amount: refundAmount,
      reason: refundReason,
      requestedBy: req.admin._id,
      requestedAt: new Date(),
      providerRefundId: refundResult.providerRefundId,
      processedAt: refundResult.status === "success" ? new Date() : undefined,
      error: refundResult.error,
    };

    payment.status = refundResult.status === "failed" ? "flagged" : "refunded";
    await payment.save();

    res.json({ success: true, payment });
  } catch (error) {
    console.error("Error refunding payment:", error);
    res.status(500).json({ success: false, message: "Failed to refund payment" });
  }
};
