const socketIO = require("socket.io");
const redisClient = require("./redis");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const { selectSocketToken } = require("../utils/authToken");

let io;

async function canAccessConversation(userId, conversationId) {
  if (!conversationId) return false;
  return Boolean(
    await Conversation.exists({
      _id: conversationId,
      participants: userId,
    })
  );
}

function initializeSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = selectSocketToken(socket.handshake);
      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      if (user.accountStatus && user.accountStatus !== "active") {
        const message =
          user.accountStatus === "deactivated"
            ? "Authentication error: Account deactivated"
            : "Authentication error: Account unavailable";
        return next(new Error(message));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: " + error.message));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.user._id})`);

    // Join user's personal room
    socket.join(socket.user._id.toString());
    socket.broadcast.emit("presence_updated", {
      userId: socket.user._id.toString(),
      status: "online",
    });

    socket.on("join_conversation", async ({ conversationId } = {}) => {
      if (!(await canAccessConversation(socket.user._id, conversationId))) {
        socket.emit("conversation_error", {
          conversationId,
          message: "Unauthorized conversation access",
        });
        return;
      }

      socket.join(conversationId);
    });

    socket.on("leave_conversation", ({ conversationId }) => {
      if (conversationId) {
        socket.leave(conversationId);
      }
    });

    // Track user's online status in Redis
    redisClient.set(
      `user:online:${socket.user._id.toString()}`,
      "true",
      "EX",
      3600
    );

    // User is typing event
    socket.on("typing", async ({ conversationId, isTyping } = {}) => {
      if (!(await canAccessConversation(socket.user._id, conversationId))) {
        return;
      }

      socket.to(conversationId).emit("user_typing", {
        userId: socket.user._id,
        conversationId,
        isTyping,
      });
    });

    // Handle presence updates (online status)
    socket.on("update_presence", ({ status }) => {
      // Store presence status in Redis
      if (status === "online") {
        redisClient.set(
          `user:online:${socket.user._id.toString()}`,
          "true",
          "EX",
          3600
        );
      } else {
        redisClient.del(`user:online:${socket.user._id.toString()}`);
      }

      socket.broadcast.emit("presence_updated", {
        userId: socket.user._id.toString(),
        status,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);

      // Set a short-lived offline indicator in Redis
      // This helps prevent flickering when user reconnects quickly
      redisClient.set(
        `user:offline:${socket.user._id.toString()}`,
        Date.now().toString(),
        "EX",
        30 // 30 seconds
      );

      // Remove online status after short delay
      setTimeout(() => {
        redisClient.del(`user:online:${socket.user._id.toString()}`);

        // Only broadcast if really disconnected (not just refreshed page)
        redisClient
          .get(`user:offline:${socket.user._id.toString()}`)
          .then((timestamp) => {
            if (timestamp) {
              socket.broadcast.emit("presence_updated", {
                userId: socket.user._id.toString(),
                status: "offline",
              });
            }
          });
      }, 5000);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

// Check if a user is online
async function isUserOnline(userId) {
  try {
    const status = await redisClient.get(`user:online:${userId}`);
    return !!status;
  } catch (error) {
    console.error("Error checking online status:", error);
    return false;
  }
}

module.exports = { initializeSocket, getIO, isUserOnline };
