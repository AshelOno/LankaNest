const express = require("express");
const mongoose = require("mongoose"); // Add the missing mongoose import
const router = express.Router();
const controller = require("../controllers/subscriptionController");
const { ensureLandlordAuth } = require("../middleware/ensureLandlordAuth");
const { verifyToken } = require("../middleware/verifyToken");

// Define specific routes BEFORE parameter routes to avoid conflicts
router.get("/success", async (req, res) => {
  try {
    // Get landlord parameters from query string
    const { landlordId, email, order_id } = req.query;

    // Extract userId from order_id if available (as backup)
    let userId = landlordId;
    if (order_id && typeof order_id === "string") {
      const orderParts = order_id.split("-");
      // Check which format we have - regular or renewal
      if (order_id.includes("-RNW-")) {
        // Format is UN-RNW-{timestamp}-{userId}
        if (orderParts.length >= 4) {
          userId = orderParts[orderParts.length - 1];
        }
      } else {
        // Regular format UN-{timestamp}-{userId}
        if (orderParts.length >= 3) {
          userId = orderParts[orderParts.length - 1];
        }
      }
    }

    // PayHere return_url is browser-only. Subscription activation must happen
    // exclusively through the verified notify_url webhook.
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.warn(`Invalid or missing userId in success redirect: ${userId}`);
    }

    // Redirect to the pricing page with success parameter
    const redirectPath =
      landlordId && email
        ? `/landlord/${landlordId}/${email}/pricing?success=true`
        : `/landlord/pricing?success=true`;

    res.redirect(`${process.env.FRONTEND_URL}${redirectPath}`);
  } catch (error) {
    console.error("Error in subscription success route:", error);

    // Capture the params locally before the error handler to use them in the redirect
    const { landlordId, email } = req.query || {};

    // Still redirect to pricing page even if there's an error
    const redirectPath =
      landlordId && email
        ? `/landlord/${landlordId}/${email}/pricing?success=true`
        : `/landlord/pricing?success=true`;

    res.redirect(`${process.env.FRONTEND_URL}${redirectPath}`);
  }
});

router.get("/cancel", (req, res) => {
  try {
    // Get landlord parameters from query string
    const { landlordId, email } = req.query;
    const redirectPath =
      landlordId && email
        ? `/landlord/${landlordId}/${email}/pricing?cancelled=true`
        : `/landlord/pricing?cancelled=true`;

    res.redirect(`${process.env.FRONTEND_URL}${redirectPath}`);
  } catch (error) {
    console.error("Error in subscription cancel route:", error);
    // Use a safe fallback redirect
    res.redirect(`${process.env.FRONTEND_URL}/landlord/pricing?cancelled=true`);
  }
});

// Now define routes with parameters
router.get("/:userId", controller.getSubscription);
router.post("/create-order", controller.createOrder);
router.post("/renew", ensureLandlordAuth, controller.renewSubscription);
router.post("/notify", controller.paymentNotify);

// Admin route to manually check for expiring subscriptions
router.post("/check-expiring", verifyToken, async (req, res) => {
  try {
    // Check if user is admin before allowing access
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const result = await controller.checkExpiringSubscriptions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
