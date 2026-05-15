const jwt = require("jsonwebtoken");
const { selectRequestToken } = require("../utils/authToken");
const User = require("../models/User");

const ACCOUNT_STATUS_MESSAGES = {
  deactivated: "Your account has been deactivated. Please contact support to reactivate it.",
  deleted: "This account is no longer available.",
};

function clearRoleCookie(res, role) {
  const cookieName =
    role === "landlord" ? "landlordToken" : role === "admin" ? "adminToken" : "token";
  res.clearCookie(cookieName);
}

async function hydrateAuthUser(req, res, decoded, hardFail) {
  req.userId = decoded.userId;
  req.authRole = decoded.role;

  if (decoded.role === "admin") {
    return true;
  }

  const user = await User.findById(decoded.userId).select("accountStatus role");
  if (!user) {
    clearRoleCookie(res, decoded.role);
    if (hardFail) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - invalid token",
      });
      return false;
    }
    req.userId = null;
    req.authRole = null;
    return false;
  }

  if (user.accountStatus !== "active") {
    clearRoleCookie(res, decoded.role);
    if (hardFail) {
      res.status(403).json({
        success: false,
        accountStatus: user.accountStatus,
        message: ACCOUNT_STATUS_MESSAGES[user.accountStatus] || "Account access is unavailable.",
      });
      return false;
    }
    req.userId = null;
    req.authRole = null;
    return false;
  }

  return true;
}

// Soft version for check-auth endpoints: never returns 401, just sets req.userId = null
exports.softVerifyToken = async (req, res, next) => {
  const relevantToken = selectRequestToken(req);

  if (!relevantToken) {
    req.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(relevantToken, process.env.JWT_SECRET);
    await hydrateAuthUser(req, res, decoded, false);
  } catch {
    req.userId = null;
    req.authRole = null;
  }
  next();
};

exports.verifyToken = async (req, res, next) => {
  const relevantToken = selectRequestToken(req);

  if (!relevantToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - no token provided",
    });
  }

  try {
    const decoded = jwt.verify(relevantToken, process.env.JWT_SECRET);
    const isValid = await hydrateAuthUser(req, res, decoded, true);
    if (!isValid) {
      return;
    }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - invalid token",
    });
  }
};
