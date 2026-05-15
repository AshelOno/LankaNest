const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken } = require('../middleware/verifyToken');

// Submit feedback route (accessible to all authenticated users)
router.post("/submit", feedbackController.submitFeedback);

// Admin routes for managing feedback
router.get("/all", verifyToken, feedbackController.getAllFeedback);
router.patch("/:id/status", verifyToken, feedbackController.updateFeedbackStatus);

module.exports = router;