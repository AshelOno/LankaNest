const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const { requireAdmin } = require("../middleware/requireAdmin");
const planController = require("../controllers/planController");

router.use(verifyToken, requireAdmin);

router.get("/", planController.listPaymentMethods);
router.patch("/:method", planController.updatePaymentMethod);

module.exports = router;
