const bcryptjs = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const { generateTokenAndSetCookie } = require("../utils/generateTokenAndSetCookie");

exports.registerAdmin = async (req, res) => {

  const { email, password, username, phoneNumber, role } = req.body;

  try {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_ADMIN_REGISTRATION !== "true"
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin registration is disabled in production",
      });
    }

    if (!email || !password || !username) {
      throw new Error('All fields (email, username, password) are required');
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const admin = new Admin({
      email,
      password: hashedPassword,
      username,
      phoneNumber,
      role: role || "admin",
      isVerified: true,
    });
    await admin.save();

    generateTokenAndSetCookie(res, admin._id, "admin");

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        ...admin._doc,
        password: undefined
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcryptjs.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res, admin._id, "admin");

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      admin: {
        ...admin._doc,
        password: undefined,
      }
    })

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
    });
  }
};

exports.logoutAdmin = async (req, res) => {
  res.clearCookie("adminToken");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

exports.checkAdminAuth = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(200).json({ success: false, message: "Not authenticated" });
        }

        const admin = await Admin.findById(req.userId).select("-password");
        if (!admin) {
            return res.status(200).json({ success: false, message: "Admin not found" });
        }

        res.status(200).json({ success: true, admin });
    } catch (error) {
        console.error("Auth check error:", error);
        res.status(200).json({ success: false, message: "Authentication failed" });
    }
};
