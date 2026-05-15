const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");

if (process.env.NODE_ENV !== "production") {
  router.get("/debug/info", recommendationController.getDebugInfo);
}
router.get("/:userId", recommendationController.getRecommendations);

module.exports = router;
