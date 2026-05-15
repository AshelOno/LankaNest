const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require("../middleware/verifyToken");
const { requireSelfParam } = require("../middleware/authorize");

// Get all notifications for a user
router.get('/user/:userId', verifyToken, requireSelfParam("userId"), notificationController.getUserNotifications);

// Mark a notification as read
router.patch('/:notificationId/read', verifyToken, notificationController.markAsRead);

module.exports = router;
