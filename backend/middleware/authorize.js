const Admin = require("../models/Admin");
const User = require("../models/User");

function requireRoles(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (req.authRole === "admin" || roles.includes("admin")) {
        const admin = await Admin.findById(req.userId).select("-password");
        if (admin && admin.role === "admin") {
          req.admin = admin;
          req.user = admin;
          if (roles.includes("admin")) return next();
        }
      }

      const user = await User.findById(req.userId).select("-password");
      if (!user || user.isFlagged) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireSelfParam(paramName) {
  return (req, res, next) => {
    const requestedId = req.params[paramName] || req.query[paramName] || req.body[paramName];
    const userId = req.userId || req.user?._id;

    if (!requestedId || !userId) {
      return res.status(400).json({ success: false, message: "Missing user context" });
    }

    if (String(requestedId) !== String(userId) && req.authRole !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    next();
  };
}

module.exports = {
  requireRoles,
  requireSelfParam,
};
