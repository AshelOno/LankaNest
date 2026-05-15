const Admin = require("../models/Admin");

exports.requireAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const admin = await Admin.findById(req.userId).select("-password");
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin privileges required",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
