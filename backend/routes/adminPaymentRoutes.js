const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const { requireAdmin } = require("../middleware/requireAdmin");
const paymentController = require("../controllers/paymentController");

router.use(verifyToken, requireAdmin);

router.get("/", paymentController.adminListPayments);
router.patch("/:id/flag", paymentController.adminFlagPayment);
router.post("/:id/approve-manual", paymentController.adminApproveManualPayment);
router.post("/:id/reject-manual", paymentController.adminRejectManualPayment);
router.post("/:id/refund", paymentController.adminRefundPayment);

module.exports = router;
