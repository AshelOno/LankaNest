const mongoose = require("mongoose");

const paymentMethodSettingSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["payhere", "manual"],
      required: true,
      unique: true,
    },
    enabled: { type: Boolean, default: true },
    displayLabel: { type: String, required: true },
    instructions: { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PaymentMethodSetting",
  paymentMethodSettingSchema
);
