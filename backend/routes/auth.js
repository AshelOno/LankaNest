const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  validateSignup,
  validateSignin,
  validateLandlordSignup1,
  validateLandlordSignup2,
  validateLandlordSignin,
} = require("../middleware/validation");
const nicUpload = require("../middleware/nicUpload");
const imageUpload = require("../middleware/imageUpload");

const {
  login,
  logout,
  signup,
  verifyEmail,
  checkAuth,
  googleCallback,
  forgotPassword,
  resetPassword,
  updateMe,
  changeMyPassword,
  deactivateMe,
  deleteMe,
} = require("../controllers/authController");

const {
  registerLandlord,
  completeLandlordProfile,
  landlordSignin,
  checkLandlordAuth,
  logoutLandlord,
  landlordForgotPassword,
  landlordResetPassword,
} = require("../controllers/landlordAuthController");

const {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  checkAdminAuth,
} = require("../controllers/adminAuthController");

const { verifyToken, softVerifyToken } = require("../middleware/verifyToken");

// Student auth routes
router.get("/check-auth", softVerifyToken, checkAuth);

router.post("/signup", validateSignup, signup);
router.post("/login", validateSignin, login);
router.post("/logout", logout);

router.post("/verify-email", verifyEmail);
router.patch("/me", verifyToken, imageUpload.single("profileImage"), updateMe);
router.patch("/me/password", verifyToken, changeMyPassword);
router.post("/me/deactivate", verifyToken, deactivateMe);
router.delete("/me", verifyToken, deleteMe);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  googleCallback
);

// Landlord auth routes
router.post(
  "/landlord/signup/step1",
  validateLandlordSignup1,
  registerLandlord
);
router.post(
  "/landlord/signup/step2/:userId",
  nicUpload.single("nicDocument"),
  validateLandlordSignup2,
  completeLandlordProfile
);

router.post("/landlord/signin", validateLandlordSignin, landlordSignin);
router.get("/landlord/checkLandlordAuth", softVerifyToken, checkLandlordAuth);
router.post("/landlord/logout", logoutLandlord);

router.post("/landlord/forgot-password", landlordForgotPassword);
router.post("/landlord/reset-password", landlordResetPassword);

// Admin auth routes
router.get("/admin/checkAdminAuth", softVerifyToken, checkAdminAuth);

router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);
router.post("/admin/logout", logoutAdmin);

// Add these routes to your auth.js
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
