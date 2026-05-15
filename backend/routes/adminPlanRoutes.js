const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const { requireAdmin } = require("../middleware/requireAdmin");
const planController = require("../controllers/planController");

router.use(verifyToken, requireAdmin);

router.get("/", planController.adminListPlans);
router.put("/:code", planController.upsertPlan);
router.delete("/:code", planController.deletePlan);

module.exports = router;
