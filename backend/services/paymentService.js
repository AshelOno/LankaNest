const crypto = require("crypto");
const Subscription = require("../models/Subscription");
const LandlordProfile = require("../models/LandlordProfile");
const Listing = require("../models/Listing");
const Notification = require("../models/Notification");
const {
  sendSubscriptionConfirmationEmail,
  sendSubscriptionExpiredEmail,
} = require("./emailService");

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function createOrderId() {
  return `LN-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
}

function createIdempotencyKey(prefix = "payment") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(12).toString("hex")}`;
}

async function activateSubscriptionFromPayment(payment, plan, options = {}) {
  const now = new Date();
  const existing = await Subscription.findOne({ userId: payment.userId });
  const baseDate =
    existing?.currentPeriodEnd && existing.currentPeriodEnd > now
      ? existing.currentPeriodEnd
      : now;
  const endAt = addDays(baseDate, plan.durationDays || 30);

  const subscription = await Subscription.findOneAndUpdate(
    { userId: payment.userId },
    {
      userId: payment.userId,
      planId: plan._id,
      planType: plan.code,
      status: "active",
      startAt: existing?.startAt || now,
      endAt,
      currentPeriodStart: baseDate,
      currentPeriodEnd: endAt,
      nextBillingDate: endAt,
      latestPaymentId: payment._id,
      autoRenew: false,
    },
    { new: true, upsert: true }
  );

  payment.subscriptionId = subscription._id;
  if (payment.status !== "success") payment.status = "success";
  await payment.save();

  await LandlordProfile.findOneAndUpdate(
    { userId: payment.userId },
    {
      "subscription.plan": plan.code,
      "subscription.status": "active",
      "subscription.startDate": subscription.currentPeriodStart,
      "subscription.endDate": subscription.currentPeriodEnd,
    }
  );

  await Listing.updateMany(
    { landlord: payment.userId, isHeldForPayment: true },
    { isHeldForPayment: false }
  );

  if (!options.skipEmail) {
    sendSubscriptionConfirmationEmail(payment.userId).catch((error) => {
      console.error("Subscription email failed:", error);
    });
  }

  return subscription;
}

async function expireSubscription(subscription) {
  await Subscription.findByIdAndUpdate(subscription._id, {
    planType: "free",
    status: "expired",
  });

  await LandlordProfile.findOneAndUpdate(
    { userId: subscription.userId },
    {
      "subscription.plan": "free",
      "subscription.status": "expired",
    }
  );

  const listings = await Listing.find({ landlord: subscription.userId }).sort({
    createdAt: 1,
  });

  for (let i = 1; i < listings.length; i += 1) {
    await Listing.findByIdAndUpdate(listings[i]._id, {
      isHeldForPayment: true,
    });
  }

  await Notification.create({
    userId: subscription.userId,
    type: "account",
    title: "Subscription Expired",
    message:
      "Your premium subscription has expired. Extra listings are now on hold. Renew to reactivate them.",
    read: false,
  });

  sendSubscriptionExpiredEmail(subscription.userId).catch((error) => {
    console.error("Subscription expiry email failed:", error);
  });
}

module.exports = {
  activateSubscriptionFromPayment,
  createIdempotencyKey,
  createOrderId,
  expireSubscription,
};
