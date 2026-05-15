const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const Bookmark = require("../models/BookMark");
const Notification = require("../models/Notification");
const {
  generateTokenAndSetCookie,
} = require("../utils/generateTokenAndSetCookie");
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");
const { uploadProfileImage } = require("../services/storageService");

const ACCOUNT_STATUS_MESSAGES = {
  deactivated: "Your account has been deactivated. Please contact support to reactivate it.",
  deleted: "This account is no longer available.",
};

function sanitizeUser(user) {
  const safeUser = user.toObject ? user.toObject() : { ...(user?._doc || user) };
  delete safeUser.password;
  return safeUser;
}

function clearUserCookie(res) {
  res.clearCookie("token");
}

function inactiveAccountResponse(res, user) {
  clearUserCookie(res);
  return res.status(403).json({
    success: false,
    accountStatus: user.accountStatus,
    message:
      ACCOUNT_STATUS_MESSAGES[user.accountStatus] ||
      "Account access is unavailable.",
  });
}

async function loadCurrentStudent(userId) {
  return User.findOne({ _id: userId, role: "user" });
}

exports.signup = async (req, res) => {
  const { email, username, password, role } = req.body;

  try {
    if (!email || !password || !username) {
      throw new Error("All fields (email, username, password) are required");
    }

    // Validate role if provided
    const validRoles = ["user", "landlord", "admin"];
    if (role && !validRoles.includes(role)) {
      throw new Error("Invalid role specified");
    }

    const userAlreadyExists = await User.findOne({ email });
    if (userAlreadyExists) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      email,
      password: hashedPassword,
      username,
      role: role || "user", // Allow role specification, default to "user"
      verificationToken,
      isVerified: role === "admin" ? true : false, // Auto-verify admins
      verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expires in 24 hours
      createdAt: new Date(),
    });

    await user.save();
    generateTokenAndSetCookie(res, user._id);

    // Send verification email (skip for admins)
    if (role !== "admin") {
      await sendVerificationEmail(user.email, verificationToken);
    }

    res.status(201).json({
      success: true,
      message: role === "admin"
        ? "Admin account created successfully! You can now log in."
        : "User created successfully! Please check your email for verification.",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.username);

    res.status(200).json({
      success: true,
      message: "Email verified successfully. Welcome to LankaNest!",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error in verifyEmail:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (user.accountStatus && user.accountStatus !== "active") {
      return inactiveAccountResponse(res, user);
    }

    // Check if user is flagged
    if (user.isFlagged) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res, user._id);
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log("Error in login:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  clearUserCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.checkAuth = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(200).json({ success: false, isAuthenticated: false });
    }
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(200).json({ success: false, isAuthenticated: false });
    }
    if (user.accountStatus && user.accountStatus !== "active") {
      clearUserCookie(res);
      return res.status(200).json({
        success: false,
        isAuthenticated: false,
        accountStatus: user.accountStatus,
        message:
          ACCOUNT_STATUS_MESSAGES[user.accountStatus] ||
          "Account access is unavailable.",
      });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth:", error);
    res.status(200).json({ success: false, isAuthenticated: false });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const { id, emails, displayName } = req.user;

    let user = await User.findOne({ email: emails[0].value });

    if (!user) {
      user = new User({
        email: emails[0].value,
        username: displayName,
        password: id + process.env.JWT_SECRET, // Unique password
        role: "user",
        isVerified: true,
      });
      await user.save();
    }

    const token = generateTokenAndSetCookie(res, user._id);

    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/success?token=${token}&userId=${user._id}`
    );
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/error`);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User with this email does not exist",
        });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set reset token and expiration (1 hour)
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpiresAt = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email with reset code
    await sendPasswordResetEmail(user.email, resetCode);

    res.status(200).json({
      success: true,
      message: "Password reset code has been sent to your email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { code, password } = req.body;

    if (!code || !password) {
      return res.status(400).json({
        success: false,
        message: "Verification code and new password are required",
      });
    }

    // Find user with the reset token
    const user = await User.findOne({
      resetPasswordToken: code,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Update password
    const hashedPassword = await bcryptjs.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await loadCurrentStudent(req.userId);
    if (!user) {
      clearUserCookie(res);
      return res.status(404).json({ success: false, message: "Student account not found" });
    }
    if (user.accountStatus !== "active") {
      return inactiveAccountResponse(res, user);
    }

    const nextUsername = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const nextPhoneNumber =
      typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber.trim() : "";

    if (!nextUsername) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    user.username = nextUsername;
    user.phoneNumber = nextPhoneNumber || undefined;

    if (req.file) {
      const upload = await uploadProfileImage(req.file, user._id.toString());
      user.profileImage = upload.url || upload.key;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

exports.changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await loadCurrentStudent(req.userId);
    if (!user) {
      clearUserCookie(res);
      return res.status(404).json({ success: false, message: "Student account not found" });
    }
    if (user.accountStatus !== "active") {
      return inactiveAccountResponse(res, user);
    }

    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcryptjs.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update password",
    });
  }
};

exports.deactivateMe = async (req, res) => {
  try {
    const user = await loadCurrentStudent(req.userId);
    if (!user) {
      clearUserCookie(res);
      return res.status(404).json({ success: false, message: "Student account not found" });
    }

    if (user.accountStatus === "deleted") {
      return inactiveAccountResponse(res, user);
    }

    user.accountStatus = "deactivated";
    await user.save();
    clearUserCookie(res);

    res.status(200).json({
      success: true,
      message: "Your account has been deactivated",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to deactivate account",
    });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    const { password, reason } = req.body || {};
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password confirmation is required",
      });
    }

    const user = await loadCurrentStudent(req.userId);
    if (!user) {
      clearUserCookie(res);
      return res.status(404).json({ success: false, message: "Student account not found" });
    }

    if (user.accountStatus === "deleted") {
      return inactiveAccountResponse(res, user);
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Password confirmation is incorrect",
      });
    }

    const randomPassword = crypto.randomBytes(24).toString("hex");
    user.email = `deleted+${user._id}@deleted.lankanest.local`;
    user.username = "Deleted user";
    user.phoneNumber = undefined;
    user.profileImage = "";
    user.accountStatus = "deleted";
    user.isVerified = false;
    user.hasCompletedPreferences = false;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    user.password = await bcryptjs.hash(randomPassword, 10);
    if (typeof reason === "string" && reason.trim()) {
      user.lastLogin = new Date();
    }

    await Promise.all([
      user.save(),
      StudentProfile.deleteMany({ userId: user._id }),
      Bookmark.deleteMany({ user: user._id }),
      Notification.deleteMany({ userId: user._id }),
    ]);

    clearUserCookie(res);

    res.status(200).json({
      success: true,
      message: "Your account has been permanently deleted",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete account",
    });
  }
};
