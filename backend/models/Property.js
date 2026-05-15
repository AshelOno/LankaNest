const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      enum: ["room", "apartment", "house", "hostel"],
      required: true,
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      city: String,
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
      nearbyUniversities: [
        {
          name: String,
          distance: Number, // in kilometers
        },
      ],
    },
    pricing: {
      monthlyRent: {
        type: Number,
        required: true,
      },
      deposit: Number,
      additionalFees: [
        {
          description: String,
          amount: Number,
        },
      ],
    },
    amenities: {
      electricity: { type: Boolean, default: false },
      water: { type: Boolean, default: false },
      internet: { type: Boolean, default: false },
      furniture: { type: Boolean, default: false },
      airConditioning: { type: Boolean, default: false },
      meals: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      security: { type: Boolean, default: false },
    },
    images: [
      {
        url: String,
        caption: String,
      },
    ],
    rules: [String],
    availability: {
      status: {
        type: String,
        enum: ["available", "occupied", "maintenance"],
        default: "available",
      },
      availableFrom: Date,
    },
    listingStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location coordinates
propertySchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model("Property", propertySchema);
