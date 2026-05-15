const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      index: true,
    },
    provider: {
      type: String,
      enum: ["payhere", "manual"],
      required: true,
    },
    eventType: { type: String, required: true },
    providerEventId: String,
    signatureValid: { type: Boolean, default: false },
    processed: { type: Boolean, default: false },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentEvent", paymentEventSchema);
