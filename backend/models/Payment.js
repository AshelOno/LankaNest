const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    provider: {
      type: String,
      enum: ["payhere", "manual"],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["subscription", "renewal", "manual_subscription"],
      default: "subscription",
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "LKR", uppercase: true },
    status: {
      type: String,
      enum: [
        "pending",
        "success",
        "failed",
        "cancelled",
        "rejected",
        "refunded",
        "flagged",
        "chargeback",
      ],
      default: "pending",
      index: true,
    },
    providerOrderId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    gatewayStatusCode: String,
    manualProof: {
      filename: String,
      originalName: String,
      storageKey: String,
      bucket: String,
      mimeType: String,
      size: Number,
      uploadedAt: Date,
      notes: String,
    },
    adminReview: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
      reviewedAt: Date,
      reason: String,
    },
    refund: {
      status: {
        type: String,
        enum: ["none", "requested", "processing", "success", "failed"],
        default: "none",
      },
      amount: Number,
      reason: String,
      providerRefundId: String,
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
      requestedAt: Date,
      processedAt: Date,
      error: String,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
