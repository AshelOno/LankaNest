const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing", // Changed from "Property" to "Listing"
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ratings: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: String,
  sentiment: {
    type: String,
    enum: ["positive", "negative", "neutral"],
    default: "neutral"
  },
  marks: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "spam", "hidden"],
    default: "pending",
  },
  spamReason: {
    type: String,
    default: null
  },
  landlordReply: {
    type: String,
    default: null,
  },
  helpfulVotes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
