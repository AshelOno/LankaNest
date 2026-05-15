const mongoose = require("mongoose");

const landlordProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  residentialAddress: {
    type: String,
    required: true,
  },
  nationalIdCardNumber: {
    type: String,
    required: true,
  },
  verificationDocuments: [
    {
      documentType: {
        type: String,
        required: true,
        enum: ['NIC', 'other']
      },
      documentKey: {
        type: String,
        required: true
      },
      bucket: {
        type: String,
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }
  ],
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  subscription: {
    plan: {
      type: String,
      enum: ["free", "basic", "premium"],
      default: "free",
    },
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
  },
});

module.exports = mongoose.model("LandlordProfile", landlordProfileSchema);
