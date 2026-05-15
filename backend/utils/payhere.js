const crypto = require("crypto");
const env = require("dotenv").config();

const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
const PAYHERE_SECRET = process.env.PAYHERE_SECRET_KEY;
const PAYHERE_BASE =
  process.env.PAYHERE_CHECKOUT_URL || "https://sandbox.payhere.lk/pay/checkout";

function generateHash(orderId, amount, currency) {
  const localMd5 = crypto
    .createHash("md5")
    .update(PAYHERE_SECRET)
    .digest("hex")
    .toUpperCase();

  const rawString = `${PAYHERE_MERCHANT_ID}${orderId}${amount}${currency}${localMd5}`;
  const hash = crypto
    .createHash("md5")
    .update(rawString)
    .digest("hex")
    .toUpperCase();

  return hash;
}

function generateNotificationHash({
  merchantId,
  orderId,
  amount,
  currency,
  statusCode,
}) {
  const localMd5 = crypto
    .createHash("md5")
    .update(PAYHERE_SECRET || "")
    .digest("hex")
    .toUpperCase();

  return crypto
    .createHash("md5")
    .update(`${merchantId}${orderId}${amount}${currency}${statusCode}${localMd5}`)
    .digest("hex")
    .toUpperCase();
}

function safeCompareHash(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(String(a).toUpperCase());
  const right = Buffer.from(String(b).toUpperCase());
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyPayhereNotification(payload) {
  const localHash = generateNotificationHash({
    merchantId: payload.merchant_id,
    orderId: payload.order_id,
    amount: payload.payhere_amount,
    currency: payload.payhere_currency,
    statusCode: payload.status_code,
  });

  return safeCompareHash(localHash, payload.md5sig);
}

function getPaymentUrl(orderId, user, amount, landlordParams = {}) {
  // Ensure we have full absolute URLs with protocol
  const configuredBackendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const baseUrl = configuredBackendUrl.startsWith("http")
    ? configuredBackendUrl
    : `http://${configuredBackendUrl}`;

  // Add landlord parameters to return and cancel URLs if provided
  const landlordQueryParams =
    landlordParams.landlordId && landlordParams.email
      ? `?landlordId=${landlordParams.landlordId}&email=${encodeURIComponent(
          landlordParams.email
        )}&order_id=${orderId}`
      : `?order_id=${orderId}`;

  // Determine if this is a renewal from order_id format
  const isRenewal = orderId.includes("-RNW-");
  const itemName = isRenewal
    ? "Landlord Premium Subscription Renewal (30 days)"
    : "Landlord Premium Subscription (30 days)";

  const userId = landlordParams.landlordId || "";

  const data = {
    merchant_id: PAYHERE_MERCHANT_ID,
    return_url: `${baseUrl}/api/payments/payhere/return${landlordQueryParams}`,
    cancel_url: `${baseUrl}/api/payments/payhere/cancel${landlordQueryParams}`,
    notify_url: `${baseUrl}/api/payments/payhere/notify`,
    order_id: orderId,
    items: itemName,
    currency: "LKR",
    amount: amount.toFixed(2),
    first_name: user.firstName,
    last_name: user.lastName,
    email: user.email,
    phone: user.phone || "0770000000",
    address: "LankaNest Subscription",
    city: "Colombo",
    country: "Sri Lanka",
    hash: generateHash(orderId, amount.toFixed(2), "LKR"),
    custom_1: isRenewal ? "renewal" : "new_subscription",
    custom_2: user.email,
    custom_3: userId, // Add userId as a custom field for easier retrieval
  };

  // Instead of constructing a URL, return the payment data and checkout URL
  return {
    checkoutUrl: PAYHERE_BASE,
    formData: data,
  };
}

module.exports = {
  generateHash,
  generateNotificationHash,
  getPaymentUrl,
  verifyPayhereNotification,
};
