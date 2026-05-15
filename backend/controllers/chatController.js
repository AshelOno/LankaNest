const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Listing = require("../models/Listing");
const { getIO } = require("../config/socket");
const chatCache = require("../services/chatCache");
const Notification = require("../models/Notification");

function emitToParticipants(event, conversation, payload) {
  const io = getIO();
  conversation.participants.forEach((participantId) => {
    io.to(participantId.toString()).emit(event, payload);
  });
}

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Try to get from cache first
    const cachedConversations = await chatCache.getCachedConversations(userId);
    if (cachedConversations) {
      return res.status(200).json(cachedConversations);
    }

    // If not in cache, get from database
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: "participants",
        select: "username email role profileImage",
      })
      .populate({
        path: "lastMessage",
        select: "text createdAt status sender",
      })
      .populate({
        path: "propertyId",
        select: "propertyName images",
      })
      .sort({ updatedAt: -1 });

    // Format the response
    const formattedConversations = conversations.map((conv) => {
      // Find the other participant (not the current user)
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        recipient: otherParticipant,
        property: conv.propertyId,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        updatedAt: conv.updatedAt,
      };
    });

    // Cache the conversations
    await chatCache.cacheUserConversations(userId, formattedConversations);

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Verify the user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to this conversation" });
    }

    // Try to get from cache first
    const cachedMessages = await chatCache.getCachedMessages(conversationId);
    if (cachedMessages) {
      // Mark as read (but don't wait for it)
      markMessagesAsReadBackground(conversationId, userId, conversation);
      return res.status(200).json(cachedMessages);
    }

    // If not in cache, get from database
    const messages = await Message.find({ conversationId })
      .populate({
        path: "sender",
        select: "username email role profileImage",
      })
      .sort({ createdAt: 1 });

    // Mark messages as read (but don't wait for it)
    markMessagesAsReadBackground(conversationId, userId, conversation);

    // Cache the messages
    await chatCache.cacheConversationMessages(conversationId, messages);

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to mark messages as read in the background
const markMessagesAsReadBackground = async (
  conversationId,
  userId,
  conversation
) => {
  try {
    // Update message status to 'read'
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        status: { $ne: "read" },
      },
      { status: "read" }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    await chatCache.invalidateMessageCache(conversationId);
    await chatCache.invalidateConversationsCache(
      conversation.participants.map((p) => p.toString())
    );

    emitToParticipants("messages_read", conversation, {
      conversationId,
      readBy: userId,
    });
  } catch (error) {
    console.error("Background read-status update error:", error);
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const senderId = req.userId;
    const messageText = typeof text === "string" ? text.trim() : "";

    // Input validation
    if (!messageText) {
      return res.status(400).json({ message: "Message text is required" });
    }

    // Check if conversation exists and user is part of it
    let conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Create new message
    const newMessage = new Message({
      conversationId,
      sender: senderId,
      text: messageText,
      status: "sent",
    });

    await newMessage.save();

    // Update conversation's last message and timestamp
    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();

    // Increment unread count for other participants
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== senderId.toString()) {
        const currentCount =
          conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(
          participantId.toString(),
          currentCount + 1
        );
      }
    });

    await conversation.save();

    // Populate sender info for the response
    const populatedMessage = await Message.findById(newMessage._id).populate({
      path: "sender",
      select: "username email role profileImage",
    });

    // Invalidate Redis caches
    await chatCache.invalidateMessageCache(conversationId);
    await chatCache.invalidateConversationsCache(
      conversation.participants.map((p) => p.toString())
    );

    // Create notification for recipient
    const recipientId = conversation.participants.find(
      (p) => p.toString() !== senderId.toString()
    );

    if (recipientId) {
      try {
        // Get sender details
        const sender = await User.findById(senderId).select("username");

        // Create notification
        const notification = new Notification({
          userId: recipientId,
          type: "message",
          title: "New Message",
          message: `${sender.username} sent you a message: "${messageText.substring(
            0,
            50
          )}${messageText.length > 50 ? "..." : ""}"`,
          relatedId: newMessage._id,
          refModel: "Message",
        });

        await notification.save();
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification fails
      }
    }

    emitToParticipants("new_message", conversation, {
      message: populatedMessage,
      conversationId,
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new conversation or get existing one
exports.createConversation = async (req, res) => {
  try {
    let { recipientId, propertyId, initialMessage, message } = req.body;
    const userId = req.userId;
    const messageText =
      typeof initialMessage === "string"
        ? initialMessage.trim()
        : typeof message === "string"
        ? message.trim()
        : "";

    let property = null;

    if (propertyId) {
      property = await Listing.findById(propertyId).select("landlord propertyName");
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (!recipientId && property.landlord) {
        recipientId = property.landlord.toString();
      }
    }

    // Input validation
    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    if (recipientId.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot start conversation with yourself" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Check if conversation already exists between these users
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      ...(propertyId ? { propertyId } : {}),
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [userId, recipientId],
        propertyId,
        unreadCount: { [recipientId]: 0 },
      });

      await conversation.save();
    }

    // If there's an initial message, send it
    let populatedInitialMessage = null;
    if (messageText) {
      const newMessage = new Message({
        conversationId: conversation._id,
        sender: userId,
        text: messageText,
        status: "sent",
      });

      await newMessage.save();

      // Update conversation
      conversation.lastMessage = newMessage._id;
      conversation.updatedAt = new Date();
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== userId.toString()) {
          const currentCount =
            conversation.unreadCount.get(participantId.toString()) || 0;
          conversation.unreadCount.set(
            participantId.toString(),
            currentCount + 1
          );
        }
      });
      await conversation.save();

      // Notify recipient
      try {
        // Get sender details
        const sender = await User.findById(userId).select("username");

        // Create notification
        const notification = new Notification({
          userId: recipientId,
          type: "message",
          title: "New Message",
          message: `${
            sender.username
          } sent you a message: "${messageText.substring(0, 50)}${
            messageText.length > 50 ? "..." : ""
          }"`,
          relatedId: newMessage._id,
          refModel: "Message",
        });

        await notification.save();
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Continue even if notification fails
      }

      populatedInitialMessage = await Message.findById(newMessage._id).populate({
        path: "sender",
        select: "username email role profileImage",
      });

      emitToParticipants("new_message", conversation, {
        message: populatedInitialMessage,
        conversationId: conversation._id,
      });
      emitToParticipants("new_conversation", conversation, {
        conversationId: conversation._id,
        sender: await User.findById(userId).select(
          "username email role profileImage"
        ),
        message: populatedInitialMessage,
      });
    }

    // Return the populated conversation
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate({
        path: "participants",
        select: "username email role profileImage",
      })
      .populate({
        path: "lastMessage",
        select: "text createdAt status sender",
      })
      .populate({
        path: "propertyId",
        select: "propertyName images",
      });

    // Format response similar to getConversations
    const otherParticipant = populatedConversation.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    const formattedConversation = {
      _id: populatedConversation._id,
      recipient: otherParticipant,
      property: populatedConversation.propertyId,
      lastMessage: populatedConversation.lastMessage,
      unreadCount:
        populatedConversation.unreadCount.get(userId.toString()) || 0,
      updatedAt: populatedConversation.updatedAt,
    };

    // Invalidate conversations cache for both users
    await chatCache.invalidateConversationsCache([userId, recipientId]);
    if (populatedInitialMessage) {
      await chatCache.invalidateMessageCache(conversation._id);
    }

    res.status(201).json({
      ...formattedConversation,
      conversation: formattedConversation,
      message: populatedInitialMessage,
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Verify the user is part of this conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res
        .status(403)
        .json({ message: "Unauthorized access to this conversation" });
    }

    // Update message status to 'read'
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        status: { $ne: "read" },
      },
      { status: "read" }
    );

    // Reset unread count
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    await chatCache.invalidateMessageCache(conversationId);

    emitToParticipants("messages_read", conversation, {
      conversationId,
      readBy: userId,
    });

    await chatCache.invalidateConversationsCache(
      conversation.participants.map((p) => p.toString())
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get unread message count for user
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all conversations for the user
    const conversations = await Conversation.find({
      participants: userId,
    });

    // Calculate total unread count
    let totalUnread = 0;
    conversations.forEach((conv) => {
      totalUnread += conv.unreadCount.get(userId.toString()) || 0;
    });

    res.status(200).json({ unreadCount: totalUnread });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
