const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  university: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  course: String,
  yearOfStudy: Number,
  
  // New preference fields
  preferredAreas: [String],
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100000 }
  },
  preferredPropertyType: {
    type: String,
    enum: ["Any", "Apartment", "Boarding House", "House", "Shared Room"],
    default: "Any"
  },
  genderPreference: {
    type: String,
    enum: ["mixed", "boys", "girls"],
    default: "mixed"
  },
  
  bookmarkedProperties: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
  ],
});

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
