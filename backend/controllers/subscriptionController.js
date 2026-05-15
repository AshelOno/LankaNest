const Subscription = require("../models/Subscription");
const User = require("../models/User");
const LandlordProfile = require("../models/LandlordProfile");
const Listing = require("../models/Listing");
const Notification = require("../models/Notification");
const { getPaymentUrl } = require("../utils/payhere");
const {
  sendSubscriptionConfirmationEmail,
  sendSubscriptionExpirationReminder,
  sendSubscriptionExpiredEmail,
} = require("../services/emailService");

exports.getSubscription = async (req, res) => {
  try {
    // Make sure we don't try to query with 'success' or 'cancel' as userId
    if (req.params.userId === "success" || req.params.userId === "cancel") {
      return res.status(400).json({
        message: "Invalid user ID parameter",
        error: "Cannot use reserved words as user ID",
      });
    }

    const subscription = await Subscription.findOne({
      userId: req.params.userId,
    });

    // Check if subscription exists and has expired
    if (subscription && subscription.nextBillingDate) {
      const now = new Date();
      if (now > new Date(subscription.nextBillingDate)) {
        // Subscription has expired, return free plan status
        return res.json({
          planType: "free",
          expired: true,
          previousPlan: "premium",
          expirationDate: subscription.nextBillingDate,
        });
      }

      // Add days until expiration
      const daysUntilExpiration = Math.ceil(
        (new Date(subscription.nextBillingDate) - now) / (1000 * 60 * 60 * 24)
      );
      subscription._doc.daysUntilExpiration = daysUntilExpiration;
    }

    res.json(subscription || { planType: "free" });
  } catch (err) {
    console.error("Error in getSubscription:", err);
    res.status(500).json({ message: "Server Error", error: err });
  }
};

exports.createOrder = async (req, res) => {
  const { userId, planType, amount, landlordId, email } = req.body;

  if (planType !== "premium")
    return res.status(400).json({ message: "Invalid plan" });

  try {
    // Fetch real user data from DB
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = {
      firstName: userData.username || "User",
      lastName: "",
      email: userData.email,
      phone: userData.phoneNumber || "0771234567",
    };

    const orderId = `UN-${Date.now()}-${userId.slice(-4)}`;

    // Pass landlord parameters to PayHere integration
    const landlordParams = { landlordId, email };
    const paymentData = getPaymentUrl(orderId, user, amount, landlordParams);

    // Log the URLs for debugging
    console.log("Payment URLs:", {
      return: paymentData.formData.return_url,
      cancel: paymentData.formData.cancel_url,
      notify: paymentData.formData.notify_url,
    });

    res.json(paymentData);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.paymentNotify = async (req, res) => {
  const {
    order_id,
    status_code,
    md5sig,
    merchant_id,
    payment_id,
    payhere_amount,
    payhere_currency,
  } = req.body;

  // Signature validation (optional but recommended)
  // Update subscription if payment is successful
  if (status_code === "2") {
    try {
      const userId = order_id.split("-")[2]; // Extract user ID

      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      await Subscription.findOneAndUpdate(
        { userId },
        {
          planType: "premium",
          nextBillingDate: expirationDate,
          status: "active", // Ensure status is set to active
        },
        { upsert: true }
      );

      // Also update the user's profile with subscription info
      const user = await User.findById(userId);
      if (user && user.role === "landlord") {
        await LandlordProfile.findOneAndUpdate(
          { userId },
          {
            "subscription.plan": "premium",
            "subscription.status": "active",
            "subscription.startDate": new Date(),
            "subscription.endDate": expirationDate,
          }
        );
      }

      // Unhide all listings that were on hold
      await Listing.updateMany(
        { landlord: userId, isHeldForPayment: true },
        { isHeldForPayment: false }
      );

      // Send confirmation email - now using emailService
      await sendSubscriptionConfirmationEmail(userId);
    } catch (error) {
      console.error("Error processing payment notification:", error);
    }
  }

  res.status(200).send("OK");
};

exports.renewSubscription = async (req, res) => {
  const { userId, planType, amount, landlordId, email } = req.body;

  if (planType !== "premium")
    return res.status(400).json({ message: "Invalid plan" });

  try {
    // Fetch real user data from DB
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = {
      firstName: userData.username || "User",
      lastName: "",
      email: userData.email,
      phone: userData.phoneNumber || "0771234567",
    };

    const orderId = `UN-RNW-${Date.now()}-${userId.slice(-4)}`;

    // Pass landlord parameters to PayHere integration
    const landlordParams = { landlordId, email };
    const paymentData = getPaymentUrl(orderId, user, amount, landlordParams);

    res.json(paymentData);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Function to check for expiring subscriptions and send notifications
// This should be called by a scheduled job
exports.checkExpiringSubscriptions = async () => {
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find subscriptions expiring in 3 days
    const expiringSubscriptions = await Subscription.find({
      planType: "premium",
      status: "active",
      nextBillingDate: {
        $gte: new Date(),
        $lte: threeDaysFromNow,
      },
    });

    // Send notifications to each user
    for (const subscription of expiringSubscriptions) {
      await sendSubscriptionExpirationReminder(subscription.userId);
    }

    // HANDLE EXPIRED SUBSCRIPTIONS
    await handleExpiredSubscriptions();

    return { success: true, count: expiringSubscriptions.length };
  } catch (error) {
    console.error("Error checking expiring subscriptions:", error);
    return { success: false, error: error.message };
  }
};

// New function to handle expired subscriptions
async function handleExpiredSubscriptions() {
  try {
    const now = new Date();

    // Find expired subscriptions that are still marked as active
    const expiredSubscriptions = await Subscription.find({
      planType: "premium",
      status: "active",
      nextBillingDate: { $lt: now },
    });

    console.log(
      `Found ${expiredSubscriptions.length} expired subscriptions to process`
    );

    for (const subscription of expiredSubscriptions) {
      // Update subscription status to expired
      await Subscription.findByIdAndUpdate(subscription._id, {
        planType: "free",
        status: "expired",
      });

      // Update landlord profile if exists
      await LandlordProfile.findOneAndUpdate(
        { userId: subscription.userId },
        {
          "subscription.plan": "free",
          "subscription.status": "expired",
        }
      );

      // Process the user's listings - keeping only the oldest one active
      await processListingsForExpiredSubscription(subscription.userId);

      // Send expiration notification
      await sendSubscriptionExpiredNotification(subscription.userId);
    }

    return expiredSubscriptions.length;
  } catch (error) {
    console.error("Error handling expired subscriptions:", error);
    return 0;
  }
}

// Process listings for a user with expired subscription
async function processListingsForExpiredSubscription(userId) {
  try {
    // Get all listings for this landlord, sorted by creation date (oldest first)
    const listings = await Listing.find({ landlord: userId }).sort({
      createdAt: 1,
    });

    if (listings.length <= 1) {
      // User has one or fewer listings, no action needed
      return;
    }

    // Keep the first/oldest listing active, mark others as held
    for (let i = 1; i < listings.length; i++) {
      await Listing.findByIdAndUpdate(listings[i]._id, {
        isHeldForPayment: true,
      });
    }

    console.log(
      `Processed ${listings.length} listings for user ${userId}, marked ${
        listings.length - 1
      } as held`
    );
  } catch (error) {
    console.error(`Error processing listings for user ${userId}:`, error);
  }
}

// Send notification when subscription expires - using emailService now
async function sendSubscriptionExpiredNotification(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Create in-app notification
    const notification = new Notification({
      userId: userId,
      type: "account",
      title: "Subscription Expired",
      message:
        "Your premium subscription has expired. Some of your listings are now on hold. Please renew your subscription to make them active again.",
      read: false,
    });

    await notification.save();

    // Send email notification using the migrated function
    await sendSubscriptionExpiredEmail(userId);
  } catch (error) {
    console.error("Error sending subscription expired notification:", error);
  }
}

// Check if user has premium subscription
exports.checkListingLimit = async (userId) => {
  try {
    const subscription = await Subscription.findOne({ userId });

    // Check if subscription exists, is premium, and not expired
    if (subscription?.planType === "premium" && subscription.nextBillingDate) {
      const now = new Date();
      if (now <= new Date(subscription.nextBillingDate)) {
        return true; // Has valid premium subscription
      }
    }

    return false; // Free plan or expired premium
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
};

// New function to update subscription when user returns from successful payment
exports.updateSubscriptionOnSuccess = async (userId, expirationDate) => {
  try {
    // Update subscription in database (similar to what we do in paymentNotify)
    await Subscription.findOneAndUpdate(
      { userId },
      {
        planType: "premium",
        nextBillingDate: expirationDate,
        status: "active",
      },
      { upsert: true }
    );

    // Also update the user's profile with subscription info
    const user = await User.findById(userId);
    if (user && user.role === "landlord") {
      await LandlordProfile.findOneAndUpdate(
        { userId },
        {
          "subscription.plan": "premium",
          "subscription.status": "active",
          "subscription.startDate": new Date(),
          "subscription.endDate": expirationDate,
        }
      );
    }

    // Unhide all listings that were on hold
    await Listing.updateMany(
      { landlord: userId, isHeldForPayment: true },
      { isHeldForPayment: false }
    );

    // Send confirmation email - add this line to ensure email is sent
    await sendSubscriptionConfirmationEmail(userId);

    console.log(`Subscription updated on success return for user ${userId}`);
    return true;
  } catch (error) {
    console.error("Error updating subscription on success:", error);
    return false;
  }
};
