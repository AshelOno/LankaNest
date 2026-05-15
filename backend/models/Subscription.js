const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: "User",
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
  },
  planType: { type: String, enum: ["free", "premium"], default: "free" },
  nextBillingDate: { type: Date },
  startAt: { type: Date },
  endAt: { type: Date },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  latestPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  autoRenew: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled", "pending"],
    default: "active",
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
