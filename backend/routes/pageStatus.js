const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const pageStatusController = require("../controllers/pageStatusController");

// Public route - Get all page statuses
router.get("/", pageStatusController.getAllPageStatus);

// Admin routes - require authentication
router.post("/update", verifyToken, pageStatusController.updatePageStatus);
router.post("/initialize", verifyToken, pageStatusController.initializeDefaultPages);

module.exports = router;