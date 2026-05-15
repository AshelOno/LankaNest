const Listing = require("../models/Listing");
const User = require("../models/User");
const Review = require("../models/Review");
const ListingReport = require("../models/ListingReport");
const Schedule = require("../models/Schedule");
const BookMark = require("../models/BookMark");
const University = require("../models/University");
const StudentProfile = require("../models/StudentProfile");
const LandlordProfile = require("../models/LandlordProfile");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const PaymentEvent = require("../models/PaymentEvent");
const Plan = require("../models/Plan");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

// Simple in-memory cache for analytics (resets on server restart)
const analyticsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached data or compute new data
async function getCachedData(key, computeFunction) {
  const cached = analyticsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await computeFunction();
  analyticsCache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Get listing statistics
exports.getListingStats = async (req, res) => {
  try {
    const data = await getCachedData("listingStats", async () => {
      // Fetch all listings
      const listings = await Listing.find();

    // Calculate total count
    const total = listings.length;

    // Calculate property type distribution
    const byPropertyType = {};
    listings.forEach((listing) => {
      const type = listing.propertyType || "Unknown";
      byPropertyType[type] = (byPropertyType[type] || 0) + 1;
    });

    // Calculate average rent
    const totalRent = listings.reduce(
      (sum, listing) => sum + (listing.monthlyRent || 0),
      0
    );
    const averageRent = total > 0 ? Math.round(totalRent / total) : 0;

    // Find listing with most views
    const highestViewed = listings.reduce(
      (max, listing) => (!max || listing.views > max.views ? listing : max),
      null
    );

    // Calculate average ELO rating
    const totalElo = listings.reduce(
      (sum, listing) => sum + (listing.eloRating || 0),
      0
    );
    const averageElo = total > 0 ? totalElo / total : 0;

    // Find most bookmarked listing
    const bookmarkCounts = await BookMark.aggregate([
      { $group: { _id: "$listing", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    let mostBookmarked = null;
    if (bookmarkCounts.length > 0) {
      mostBookmarked = await Listing.findById(bookmarkCounts[0]._id);
    }

    // Get city distribution
    const cityDistribution = {};
    listings.forEach((listing) => {
      const city = listing.city || "Unknown";
      cityDistribution[city] = (cityDistribution[city] || 0) + 1;
    });

    // Get price ranges distribution
    const priceRanges = {
      "Under 500": 0,
      "500-1000": 0,
      "1000-1500": 0,
      "1500-2000": 0,
      "Over 2000": 0,
    };

    listings.forEach((listing) => {
      const rent = listing.monthlyRent || 0;
      if (rent < 500) priceRanges["Under 500"]++;
      else if (rent < 1000) priceRanges["500-1000"]++;
      else if (rent < 1500) priceRanges["1000-1500"]++;
      else if (rent < 2000) priceRanges["1500-2000"]++;
      else priceRanges["Over 2000"]++;
    });

    // Count listings created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentListings = listings.filter(
      (listing) => new Date(listing.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      total,
      byPropertyType,
      averageRent,
      highestViewed: highestViewed
        ? {
            _id: highestViewed._id,
            propertyName: highestViewed.propertyName,
            views: highestViewed.views,
          }
        : null,
      mostBookmarked: mostBookmarked
        ? {
            _id: mostBookmarked._id,
            propertyName: mostBookmarked.propertyName,
            bookmarkCount: bookmarkCounts[0].count,
          }
        : null,
      averageElo,
      cityDistribution,
      priceRanges,
      recentListings,
      newListingsRate:
        total > 0 ? ((recentListings / total) * 100).toFixed(1) : 0,
    };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching listing stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching listing statistics",
      error: error.message,
    });
  }
};

// Get report statistics
exports.getReportStats = async (req, res) => {
  try {
    // Fetch all reports
    const reports = await ListingReport.find();

    // Calculate total count
    const total = reports.length;

    // Calculate reports by status
    const pending = reports.filter(
      (report) => report.status === "pending"
    ).length;
    const investigating = reports.filter(
      (report) => report.status === "investigating"
    ).length;
    const resolved = reports.filter(
      (report) => report.status === "resolved"
    ).length;
    const dismissed = reports.filter(
      (report) => report.status === "dismissed"
    ).length;

    // Calculate reports by type
    const byType = {};
    reports.forEach((report) => {
      const type = report.type || "Unknown";
      byType[type] = (byType[type] || 0) + 1;
    });

    // Reports created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentReports = reports.filter(
      (report) => new Date(report.createdAt) >= sevenDaysAgo
    ).length;

    // Get most reported listings (top 5)
    const reportedListings = await ListingReport.aggregate([
      { $group: { _id: "$listingId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Resolution time metrics
    const resolvedReports = reports.filter(
      (report) => report.status === "resolved" && report.resolvedAt
    );

    let averageResolutionTime = 0;
    if (resolvedReports.length > 0) {
      const totalTime = resolvedReports.reduce((sum, report) => {
        const createdDate = new Date(report.createdAt);
        const resolvedDate = new Date(report.resolvedAt);
        return sum + (resolvedDate - createdDate);
      }, 0);

      // Average time in hours
      averageResolutionTime = Math.round(
        totalTime / resolvedReports.length / (1000 * 60 * 60)
      );
    }

    res.status(200).json({
      total,
      pending,
      investigating,
      resolved,
      dismissed,
      byType,
      recentReports,
      weeklyTrend: total > 0 ? ((recentReports / total) * 100).toFixed(1) : 0,
      topReportedListings: reportedListings,
      averageResolutionTime,
    });
  } catch (error) {
    console.error("Error fetching report stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching report statistics",
      error: error.message,
    });
  }
};

// Get review statistics
exports.getReviewStats = async (req, res) => {
  try {
    // Fetch all reviews
    const reviews = await Review.find();

    // Calculate total count
    const total = reviews.length;

    // Calculate spam reviews
    const spam = reviews.filter((review) => review.status === "spam").length;

    // Calculate reviews by status
    const pending = reviews.filter(
      (review) => review.status === "pending"
    ).length;
    const approved = reviews.filter(
      (review) => review.status === "approved"
    ).length;
    const rejected = reviews.filter(
      (review) => review.status === "rejected"
    ).length;

    // Calculate average rating
    const totalRating = reviews.reduce(
      (sum, review) => sum + (review.ratings || 0),
      0
    );
    const averageRating = total > 0 ? (totalRating / total).toFixed(1) : 0;

    // Calculate sentiment distribution
    const sentiments = {
      positive: reviews.filter((review) => review.sentiment === "positive")
        .length,
      neutral: reviews.filter((review) => review.sentiment === "neutral")
        .length,
      negative: reviews.filter((review) => review.sentiment === "negative")
        .length,
    };

    // Get rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      const rating = review.ratings;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[Math.floor(rating)]++;
      }
    });

    // Reviews in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = reviews.filter(
      (review) => new Date(review.createdAt) >= thirtyDaysAgo
    ).length;

    // Most reviewed listings
    const reviewedListings = await Review.aggregate([
      {
        $group: {
          _id: "$propertyId",
          count: { $sum: 1 },
          avgRating: { $avg: "$ratings" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      total,
      spam,
      pending,
      approved,
      rejected,
      averageRating,
      sentiments,
      ratingDistribution,
      recentReviews,
      monthlyRate: total > 0 ? ((recentReviews / total) * 100).toFixed(1) : 0,
      topReviewedListings: reviewedListings,
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching review statistics",
      error: error.message,
    });
  }
};

// Get schedule statistics
exports.getScheduleStats = async (req, res) => {
  try {
    // Fetch all schedules
    const schedules = await Schedule.find();

    // Calculate total count
    const total = schedules.length;

    // Calculate schedules by status
    const pending = schedules.filter(
      (schedule) => schedule.status === "pending"
    ).length;
    const confirmed = schedules.filter(
      (schedule) => schedule.status === "confirmed"
    ).length;
    const rejected = schedules.filter(
      (schedule) => schedule.status === "rejected"
    ).length;

    // Get popular days (for scheduling)
    const dayCount = {};
    schedules.forEach((schedule) => {
      const day = new Date(schedule.date).getDay();
      const dayName = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][day];
      dayCount[dayName] = (dayCount[dayName] || 0) + 1;
    });

    // Get most popular time slots
    const timeCount = {};
    schedules.forEach((schedule) => {
      const hour = schedule.time.split(":")[0];
      timeCount[hour] = (timeCount[hour] || 0) + 1;
    });

    // Schedules in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSchedules = schedules.filter(
      (schedule) => new Date(schedule.createdAt) >= sevenDaysAgo
    ).length;

    // Calculate conversion rate (confirmed / total)
    const conversionRate =
      total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0;

    // Most scheduled listings
    const scheduledListings = await Schedule.aggregate([
      { $group: { _id: "$listingId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Landlords with most schedules
    const topLandlords = await Schedule.aggregate([
      { $group: { _id: "$landlordId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      total,
      pending,
      confirmed,
      rejected,
      popularDays: dayCount,
      popularTimes: timeCount,
      recentSchedules,
      weeklyRate: total > 0 ? ((recentSchedules / total) * 100).toFixed(1) : 0,
      conversionRate,
      topScheduledListings: scheduledListings,
      topLandlords,
    });
  } catch (error) {
    console.error("Error fetching schedule stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schedule statistics",
      error: error.message,
    });
  }
};

// New function for advanced user statistics
exports.getUserStats = async (req, res) => {
  try {
    // Fetch all users
    const users = await User.find();

    // Basic counts
    const total = users.length;
    const students = users.filter((user) => user.role === "user").length;
    const landlords = users.filter((user) => user.role === "landlord").length;
    const admins = users.filter((user) => user.role === "admin").length;
    const flagged = users.filter((user) => user.isFlagged).length;
    const verified = users.filter((user) => user.isVerified).length;

    // User growth analytics
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Monthly registrations over past 6 months
    const monthlyGrowth = {};
    for (let i = 0; i < 6; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      if (month < 0) {
        month += 12;
        year -= 1;
      }

      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const monthName = monthStart.toLocaleString("default", {
        month: "short",
      });

      const monthlyUsers = users.filter((user) => {
        const created = new Date(user.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;

      monthlyGrowth[`${monthName} ${year}`] = monthlyUsers;
    }

    // Get Student Preferences Stats
    const studentProfiles = await StudentProfile.find();
    const preferredPropertyTypes = {};
    const preferredAreas = {};

    studentProfiles.forEach((profile) => {
      if (profile.preferredPropertyType) {
        preferredPropertyTypes[profile.preferredPropertyType] =
          (preferredPropertyTypes[profile.preferredPropertyType] || 0) + 1;
      }

      if (profile.preferredAreas && profile.preferredAreas.length > 0) {
        profile.preferredAreas.forEach((area) => {
          preferredAreas[area] = (preferredAreas[area] || 0) + 1;
        });
      }
    });

    // Subscription analytics
    const subscriptions = await Subscription.find();
    const premiumUsers = subscriptions.filter(
      (sub) => sub.planType === "premium" && sub.status === "active"
    ).length;

    // Verification stats for landlords
    const landlordProfiles = await LandlordProfile.find();
    const verificationStats = {
      pending: landlordProfiles.filter(
        (profile) => profile.verificationStatus === "pending"
      ).length,
      verified: landlordProfiles.filter(
        (profile) => profile.verificationStatus === "verified"
      ).length,
      rejected: landlordProfiles.filter(
        (profile) => profile.verificationStatus === "rejected"
      ).length,
    };

    // User activity metrics
    const now = new Date();
    const activeLast24h = users.filter((user) => {
      const lastLogin = new Date(user.lastLogin);
      const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);
      return hoursSinceLogin <= 24;
    }).length;

    const activeLast7d = users.filter((user) => {
      const lastLogin = new Date(user.lastLogin);
      const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);
      return daysSinceLogin <= 7;
    }).length;

    const activeLast30d = users.filter((user) => {
      const lastLogin = new Date(user.lastLogin);
      const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);
      return daysSinceLogin <= 30;
    }).length;

    res.status(200).json({
      total,
      students,
      landlords,
      admins,
      flagged,
      verified,
      monthlyGrowth,
      studentPreferences: {
        propertyTypes: preferredPropertyTypes,
        areas: preferredAreas,
      },
      subscriptions: {
        premium: premiumUsers,
        premiumRate:
          total > 0 ? ((premiumUsers / total) * 100).toFixed(1) : 0,
      },
      landlordVerification: verificationStats,
      activity: {
        activeLast24h,
        activeLast7d,
        activeLast30d,
        activeRate24h:
          total > 0 ? ((activeLast24h / total) * 100).toFixed(1) : 0,
        activeRate7d: total > 0 ? ((activeLast7d / total) * 100).toFixed(1) : 0,
        activeRate30d:
      total > 0 ? ((activeLast30d / total) * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
};

// New function for communication statistics
exports.getCommunicationStats = async (req, res) => {
  try {
    // Messaging stats
    const conversations = await Conversation.find();
    const messages = await Message.find();

    // Basic counts
    const totalConversations = conversations.length;
    const totalMessages = messages.length;

    // Average messages per conversation
    const avgMessagesPerConversation =
      totalConversations > 0
        ? (totalMessages / totalConversations).toFixed(1)
        : 0;

    // Messages in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMessages = messages.filter(
      (message) => new Date(message.createdAt) >= sevenDaysAgo
    ).length;

    // Daily message volume over past week
    const dailyMessages = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];

      dailyMessages[dayKey] = messages.filter((message) => {
        const messageDate = new Date(message.createdAt)
          .toISOString()
          .split("T")[0];
        return messageDate === dayKey;
      }).length;
    }

    // Notification stats
    const notifications = await Notification.find();
    const notificationsByType = {};

    notifications.forEach((notification) => {
      notificationsByType[notification.type] =
        (notificationsByType[notification.type] || 0) + 1;
    });

    // Read rate for notifications
    const readNotifications = notifications.filter(
      (notification) => notification.read
    ).length;
    const readRate =
      notifications.length > 0
        ? ((readNotifications / notifications.length) * 100).toFixed(1)
        : 0;

    res.status(200).json({
      messaging: {
        totalConversations,
        totalMessages,
        avgMessagesPerConversation,
        recentMessages,
        dailyMessages,
      },
      notifications: {
        total: notifications.length,
        byType: notificationsByType,
        readRate,
      },
    });
  } catch (error) {
    console.error("Error fetching communication stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching communication statistics",
      error: error.message,
    });
  }
};

// New function for financial analytics
exports.getFinancialStats = async (req, res) => {
  try {
    // Fetch all payments
    const payments = await Payment.find();

    // Basic payment counts
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(
      (payment) => payment.status === "success"
    ).length;
    const pendingPayments = payments.filter(
      (payment) => payment.status === "pending"
    ).length;
    const failedPayments = payments.filter(
      (payment) => payment.status === "failed"
    ).length;

    // Revenue calculations
    const totalRevenue = payments
      .filter((payment) => payment.status === "success")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    const monthlyRevenue = {};
    const currentYear = new Date().getFullYear();

    // Calculate monthly revenue for the past 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyAmount = payments
        .filter(
          (payment) =>
            payment.status === "success" &&
            new Date(payment.createdAt) >= monthStart &&
            new Date(payment.createdAt) <= monthEnd
        )
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      monthlyRevenue[monthKey] = monthlyAmount;
    }

    // Payment method distribution
    const paymentMethods = {};
    payments.forEach((payment) => {
      const method = payment.provider || "unknown";
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Plan popularity
    const planStats = await Payment.aggregate([
      {
        $match: { status: "success", planId: { $exists: true } },
      },
      {
        $group: {
          _id: "$planId",
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "plans",
          localField: "_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $unwind: "$plan",
      },
      {
        $project: {
          name: "$plan.name",
          count: 1,
          revenue: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Subscription analytics
    const subscriptions = await Subscription.find();
    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.status === "active"
    ).length;
    const expiredSubscriptions = subscriptions.filter(
      (sub) => sub.status === "expired"
    ).length;
    const cancelledSubscriptions = subscriptions.filter(
      (sub) => sub.status === "cancelled"
    ).length;

    // Average revenue per user (ARPU)
    const totalUsers = await User.countDocuments();
    const arpu = totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : 0;

    // Refund statistics
    const refundedPayments = payments.filter(
      (payment) => payment.refund && payment.refund.status === "success"
    );
    const totalRefunds = refundedPayments.reduce(
      (sum, payment) => sum + (payment.refund.amount || 0),
      0
    );
    const refundRate =
      totalRevenue > 0 ? ((totalRefunds / totalRevenue) * 100).toFixed(2) : 0;

    res.status(200).json({
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        pending: pendingPayments,
        failed: failedPayments,
        successRate:
          totalPayments > 0
            ? ((successfulPayments / totalPayments) * 100).toFixed(1)
            : 0,
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        arpu: arpu,
      },
      refunds: {
        total: totalRefunds,
        count: refundedPayments.length,
        rate: refundRate,
      },
      subscriptions: {
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        cancelled: cancelledSubscriptions,
        total: subscriptions.length,
      },
      paymentMethods,
      popularPlans: planStats,
    });
  } catch (error) {
    console.error("Error fetching financial stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching financial statistics",
      error: error.message,
    });
  }
};

// Clear analytics cache (admin only)
exports.clearAnalyticsCache = async (req, res) => {
  try {
    analyticsCache.clear();
    res.status(200).json({
      success: true,
      message: "Analytics cache cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing analytics cache:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing analytics cache",
      error: error.message,
    });
  }
};
