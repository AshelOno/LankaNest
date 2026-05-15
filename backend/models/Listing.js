// models/Listing.js
const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    propertyName: { type: String, required: true },
    propertyType: { type: String, required: true },
    builtYear: { type: String, required: true },
    size: { type: Number },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    garage: { type: Number },
    monthlyRent: { type: Number, required: true },
    description: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String },
    nearestUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      required: true,
    },
    universityDistance: { type: Number },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    images: [String],
    landlord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    genderPreference: {
      type: String,
      enum: ["boys", "girls", "mixed"],
      required: true,
      default: "mixed",
    },
    isHeldForPayment: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    createdAt: { type: Date, default: Date.now },
    eloRating: { type: Number, default: 1400 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
