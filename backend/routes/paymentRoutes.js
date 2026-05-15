const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const paymentProofUpload = require("../middleware/paymentProofUpload");
const paymentController = require("../controllers/paymentController");

router.get("/my", verifyToken, paymentController.getMyPayments);
router.get("/subscription/me", verifyToken, paymentController.getMySubscription);

router.post(
  "/payhere/subscription-order",
  verifyToken,
  paymentController.createPayhereSubscriptionOrder
);
router.post("/payhere/notify", paymentController.handlePayhereNotify);
router.get("/payhere/return", paymentController.handlePayhereReturn);
router.get("/payhere/cancel", paymentController.handlePayhereCancel);

router.post(
  "/manual",
  verifyToken,
  paymentProofUpload.single("receipt"),
  paymentController.createManualPayment
);

module.exports = router;
