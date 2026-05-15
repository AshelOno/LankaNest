const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "LKR", uppercase: true },
    },
    durationDays: { type: Number, required: true, min: 0 },
    listingLimit: { type: Number, required: true, min: 0 },
    features: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
