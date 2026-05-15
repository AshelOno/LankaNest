const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const paymentController = require("../controllers/paymentController");

router.get("/me", verifyToken, paymentController.getMySubscription);

module.exports = router;
