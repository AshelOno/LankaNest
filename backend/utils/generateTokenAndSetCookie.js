const jwt = require("jsonwebtoken");

exports.generateTokenAndSetCookie = (res, userId, role = "student") => {
  const token = jwt.sign(
    { userId, role }, // ✅ include role
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  let cookieName = "token";
  if (role === "landlord") cookieName = "landlordToken";
  if (role === "admin") cookieName = "adminToken";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ✅ FIX
    maxAge: 24 * 60 * 60 * 1000,
  });

  return token;
};