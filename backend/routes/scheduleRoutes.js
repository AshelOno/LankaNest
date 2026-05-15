const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { verifyToken } = require("../middleware/verifyToken");
const { requireSelfParam } = require("../middleware/authorize");

router.post("/addSchedule", verifyToken, scheduleController.addSchedule);

router.get("/user/:userId", verifyToken, requireSelfParam("userId"), scheduleController.getSchedulesByUserId);

router.get(
  "/landlord/:landlordId",
  verifyToken,
  requireSelfParam("landlordId"),
  scheduleController.getSchedulesByLandlordId
);

router.patch("/:scheduleId/status", verifyToken, scheduleController.updateScheduleStatus);

// New routes for availability checking
router.get("/check-availability", scheduleController.checkAvailability);
router.get("/available-time-slots", scheduleController.getAvailableTimeSlots);

module.exports = router;
