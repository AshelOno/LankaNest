const redisClient = require("../config/redis");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

// Cache recent messages for a conversation
const cacheConversationMessages = async (conversationId, messages) => {
  try {
    // Store serialized messages
    await redisClient.setex(
      `chat:messages:${conversationId}`,
      CACHE_TTL,
      JSON.stringify(messages)
    );
    return true;
  } catch (error) {
    console.error("Redis caching error:", error);
    return false;
  }
};

// Get cached messages
const getCachedMessages = async (conversationId) => {
  try {
    const cachedMessages = await redisClient.get(
      `chat:messages:${conversationId}`
    );
    if (cachedMessages) {
      return JSON.parse(cachedMessages);
    }
    return null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

// Cache user's recent conversations
const cacheUserConversations = async (userId, conversations) => {
  try {
    await redisClient.setex(
      `chat:conversations:${userId}`,
      CACHE_TTL,
      JSON.stringify(conversations)
    );
    return true;
  } catch (error) {
    console.error("Redis caching error:", error);
    return false;
  }
};

// Get cached conversations
const getCachedConversations = async (userId) => {
  try {
    const cachedConversations = await redisClient.get(
      `chat:conversations:${userId}`
    );
    if (cachedConversations) {
      return JSON.parse(cachedConversations);
    }
    return null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

// Invalidate cache when new message is sent
const invalidateMessageCache = async (conversationId) => {
  try {
    await redisClient.del(`chat:messages:${conversationId}`);
    return true;
  } catch (error) {
    console.error("Redis invalidation error:", error);
    return false;
  }
};

// Invalidate conversations cache for both users
const invalidateConversationsCache = async (userIds) => {
  try {
    const pipeline = redisClient.pipeline();
    for (const userId of userIds) {
      pipeline.del(`chat:conversations:${userId}`);
    }
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error("Redis invalidation error:", error);
    return false;
  }
};

module.exports = {
  cacheConversationMessages,
  getCachedMessages,
  cacheUserConversations,
  getCachedConversations,
  invalidateMessageCache,
  invalidateConversationsCache,
};
