const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const chatController = require("../controllers/chatController");

// Get all conversations for current user
router.get("/conversations", verifyToken, chatController.getConversations);

// Get messages for a specific conversation
router.get(
  "/conversations/:conversationId/messages",
  verifyToken,
  chatController.getMessages
);

// Send a message
router.post("/messages", verifyToken, chatController.sendMessage);

// Create a new conversation
router.post("/conversations", verifyToken, chatController.createConversation);

// Mark messages as read
router.put(
  "/conversations/:conversationId/read",
  verifyToken,
  chatController.markAsRead
);

// Get total unread message count
router.get("/unread-count", verifyToken, chatController.getUnreadCount);

module.exports = router;
