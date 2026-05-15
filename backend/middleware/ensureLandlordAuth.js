const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.ensureLandlordAuth = async (req, res, next) => {
  try {
    const token = req.cookies.landlordToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token expired or invalid",
      });
    }

    // ✅ Role check from token (fast fail)
    if (decoded.role !== "landlord") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // ✅ Fetch user
    const landlord = await User.findById(decoded.userId).select("-password");

    if (!landlord || landlord.role !== "landlord") {
      return res.status(401).json({
        success: false,
        message: "Invalid landlord account",
      });
    }

    // ✅ Optional: block flagged users globally
    if (landlord.isFlagged) {
      return res.status(403).json({
        success: false,
        message: "Account suspended",
      });
    }

    req.user = landlord;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};