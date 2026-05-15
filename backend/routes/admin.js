const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/verifyToken");
const { requireAdmin } = require("../middleware/requireAdmin");
const {
  getPendingLandlords,
  approveLandlord,
  rejectLandlord,
} = require("../controllers/landlordVerifyController");
const {
  getAllUsers,
  flagUsers,
  generateDocumentUrl,
  createAdmin,
} = require("../controllers/manageUsersController");
const { addUniversity } = require("../controllers/universityController");
const {
  getListingStats,
  getReportStats,
  getReviewStats,
  getScheduleStats,
  getUserStats,
  getCommunicationStats,
  getFinancialStats,
  clearAnalyticsCache,
} = require("../controllers/adminStatsController");

router.use(verifyToken, requireAdmin);

// Protected admin routes
router.get("/unverified-landlords", getPendingLandlords);
router.post("/approve-landlord/:userId", approveLandlord);
router.delete("/reject-landlord/:userId", rejectLandlord);
router.post("/add-university", addUniversity);

// User management routes
router.get("/all-users", getAllUsers);
router.patch("/toggle-user-flag/:userId", flagUsers);
router.get("/generate-document-url/:documentKey", generateDocumentUrl);
router.post("/create-admin", createAdmin);

// Admin statistics routes
router.get("/listing-stats", getListingStats);
router.get("/report-stats", getReportStats);
router.get("/review-stats", getReviewStats);
router.get("/schedule-stats", getScheduleStats);
router.get("/user-stats", getUserStats);
router.get("/communication-stats", getCommunicationStats);
router.get("/financial-stats", getFinancialStats);
router.post("/clear-analytics-cache", clearAnalyticsCache);

// Payment and billing administration
router.use("/payments", require("./adminPaymentRoutes"));
router.use("/plans", require("./adminPlanRoutes"));
router.use("/payment-methods", require("./adminPaymentMethodRoutes"));

module.exports = router;
