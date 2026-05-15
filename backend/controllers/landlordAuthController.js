const bcryptjs = require("bcryptjs");

const { validationResult } = require("express-validator");
const User = require("../models/User");
const LandlordProfile = require("../models/LandlordProfile");
const { uploadPrivateDocument } = require("../services/storageService");

const {
  generateTokenAndSetCookie,
} = require("../utils/generateTokenAndSetCookie");
const validateNIC = require("../middleware/nicValidation");

const ACCOUNT_STATUS_MESSAGES = {
  deactivated: "Your account has been deactivated. Please contact support to reactivate it.",
  deleted: "This account is no longer available.",
};

exports.registerLandlord = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, phone, password } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if phone number already exists
    const phoneExists = await User.findOne({ phoneNumber: phone });
    if (phoneExists) {
      return res
        .status(400)
        .json({ message: "Phone number already registered" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      username,
      phoneNumber: phone,
      role: "landlord",
      isVerified: false,
    });

    await user.save();

    generateTokenAndSetCookie(res, user._id, "landlord");

    res.status(201).json({
      message: "Landlord registration initiated",
      userId: user._id,
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.completeLandlordProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { residentialAddress, nationalIdCardNumber } = req.body;
    const nicDocument = req.file;

    if (!nicDocument) {
      return res.status(400).json({ message: "NIC document is required" });
    }

    // Validate NIC number
    try {
      const { isFake } = validateNIC(nationalIdCardNumber);
      if (isFake) {
        return res
          .status(400)
          .json({ message: "Invalid NIC number: Age is not realistic." });
      }
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user || user.role !== "landlord") {
      return res.status(404).json({ message: "User not found" });
    }

    let uploadResult;
    try {
      uploadResult = await uploadPrivateDocument(
        nicDocument,
        `landlords/${userId}/nic`
      );
    } catch (uploadError) {
      console.error("S3 upload error:", uploadError);
      throw new Error(`S3 upload failed: ${uploadError.message}`);
    }

    // Create landlord profile
    const landlordProfile = new LandlordProfile({
      userId,
      residentialAddress,
      nationalIdCardNumber,
      verificationStatus: "pending",
      verificationDocuments: [
        {
          documentType: "NIC",
          documentKey: uploadResult.key,
          bucket: uploadResult.bucket,
          uploadDate: new Date(),
        },
      ],
      subscription: {
        plan: "free",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await landlordProfile.save();

    res.status(200).json({
      message: "Landlord profile completed, waiting for verification",
      profile: landlordProfile,
    });
  } catch (error) {
    console.error("Complete error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.landlordSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ Find user
    const landlord = await User.findOne({
      email: normalizedEmail,
      role: "landlord",
    });

    // ✅ Prevent user enumeration
    if (!landlord) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (landlord.accountStatus && landlord.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        accountStatus: landlord.accountStatus,
        message:
          ACCOUNT_STATUS_MESSAGES[landlord.accountStatus] ||
          "Account access is unavailable.",
      });
    }

    // ✅ Compare password safely
    const isMatch = await bcryptjs.compare(password, landlord.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Check flagged
    if (landlord.isFlagged) {
      return res.status(403).json({
        success: false,
        isFlagged: true,
        message: "Your account has been suspended. Contact support.",
      });
    }

    // ✅ Get profile (optional but safer)
    const profile = await LandlordProfile.findOne({
      userId: landlord._id,
    });

    // ✅ Update login timestamp
    landlord.lastLogin = new Date();
    await landlord.save();

    // ✅ Set secure cookie
    generateTokenAndSetCookie(res, landlord._id, "landlord");

    return res.status(200).json({
      success: true,
      landlord: {
        _id: landlord._id.toString(),
        email: landlord.email,
        username: landlord.username,
        isVerified: landlord.isVerified,
        verificationStatus: profile?.verificationStatus || "not_started",
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.checkLandlordAuth = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(200).json({ success: false, message: "Not authenticated" });
    }

    const landlord = await User.findById(req.userId)
      .select("-password")
      .where("role")
      .equals("landlord");

    if (!landlord) {
      return res.status(200).json({ success: false, message: "Invalid landlord account" });
    }

    if (landlord.accountStatus && landlord.accountStatus !== "active") {
      res.clearCookie("landlordToken");
      return res.status(200).json({
        success: false,
        accountStatus: landlord.accountStatus,
        message:
          ACCOUNT_STATUS_MESSAGES[landlord.accountStatus] ||
          "Account access is unavailable.",
      });
    }

    const landlordProfile = await LandlordProfile.findOne({
      userId: landlord._id,
    });

    res.status(200).json({
      success: true,
      landlord: {
        _id: landlord._id.toString(),
        email: landlord.email,
        username: landlord.username,
        isVerified: landlord.isVerified,
        profile: landlordProfile,
      },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(200).json({ success: false, message: "Authentication failed" });
  }
};

exports.logoutLandlord = async (req, res) => {
  res.clearCookie("landlordToken"); // Change to landlordToken
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// Add these functions to your landlordAuthController.js

exports.landlordForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // FIXED: Use User model with role: "landlord" instead of Landlord model
    const landlord = await User.findOne({ email, role: "landlord" });

    // For security reasons, always return the same response even if user doesn't exist
    if (!landlord) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with this email exists, a password reset code has been sent",
      });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update landlord with reset token
    landlord.resetPasswordToken = resetCode;
    landlord.resetPasswordExpiresAt = new Date(Date.now() + 3600000); // 1 hour
    await landlord.save();

    // Make sure you've defined this function and imported it
    const { sendPasswordResetEmail } = require("../services/emailService");

    // Send email with reset code - add try/catch specifically for email sending
    try {
      await sendPasswordResetEmail(landlord.email, resetCode);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset code has been sent to your email",
    });
  } catch (error) {
    console.error("Landlord forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.landlordResetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!code || !password || !email) {
      return res.status(400).json({
        success: false,
        message: "Email, verification code and new password are required",
      });
    }

    // Find landlord with the reset token and matching email
    const landlord = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpiresAt: { $gt: Date.now() },
      role: "landlord",
    });

    if (!landlord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Update password
    const hashedPassword = await bcryptjs.hash(password, 10);
    landlord.password = hashedPassword;
    landlord.resetPasswordToken = undefined;
    landlord.resetPasswordExpiresAt = undefined;
    await landlord.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Landlord reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
