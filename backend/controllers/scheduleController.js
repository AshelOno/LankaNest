const Schedule = require("../models/Schedule");
const User = require("../models/User");
const Listing = require("../models/Listing");
const {
  sendScheduleNotification,
  sendScheduleStatusEmail,
} = require("../services/emailService");
const Notification = require("../models/Notification");

exports.addSchedule = async (req, res) => {
  try {
    const { studentId, landlordId, listingId, date, time } = req.body;

    if (String(studentId) !== String(req.userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Validate time is between 7am and 6pm
    const [hours, minutes] = time.split(":").map(Number);
    if (hours < 7 || hours >= 18) {
      return res.status(400).json({
        message: "Booking time must be between 7:00 AM and 6:00 PM",
      });
    }

    // Check if there's already a confirmed booking for this property at the same time
    const existingBooking = await Schedule.findOne({
      listingId,
      date,
      time,
      status: "confirmed",
    });

    if (existingBooking) {
      return res.status(409).json({
        message:
          "This time slot is already booked. Please select a different time.",
      });
    }

    // Create new schedule
    const newSchedule = new Schedule({
      userId: studentId,
      landlordId,
      listingId,
      date,
      time,
    });

    await newSchedule.save();

    // Fetch additional information needed for emails
    const student = await User.findById(studentId);
    const landlord = await User.findById(landlordId);
    const listing = await Listing.findById(listingId);

    if (student && landlord && listing) {
      // Send notification emails to both parties
      await sendScheduleNotification(
        student.email,
        student.username,
        landlord.email,
        landlord.username,
        listing.propertyName,
        date,
        time
      );

      // Create in-app notification for landlord
      const landlordNotification = new Notification({
        userId: landlordId,
        type: "property_update",
        title: "New Visit Scheduled",
        message: `${student.username} has scheduled a visit to ${listing.propertyName} on ${date} at ${time}`,
        relatedId: listingId,
        refModel: "Property",
      });
      await landlordNotification.save();

      // Create in-app notification for student
      const studentNotification = new Notification({
        userId: studentId,
        type: "property_update",
        title: "Visit Scheduled Successfully",
        message: `Your visit to ${listing.propertyName} has been scheduled for ${date} at ${time}`,
        relatedId: listingId,
        refModel: "Property",
      });
      await studentNotification.save();
    }

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: newSchedule,
    });
  } catch (error) {
    console.error("Error in addSchedule:", error);
    res
      .status(500)
      .json({ message: "Error creating schedule", error: error.message });
  }
};

exports.getSchedulesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all schedules for this user and populate with listing details
    const schedules = await Schedule.find({ userId })
      .populate({
        path: "listingId",
        select: "propertyName images propertyType address city province",
      })
      .populate({
        path: "landlordId",
        select: "username email phoneNumber",
        match: { role: "landlord" },
      })
      .sort({ date: 1, time: 1 });

    res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching user schedules:", error);
    res.status(500).json({
      message: "Error fetching schedules",
      error: error.message,
    });
  }
};

exports.getSchedulesByLandlordId = async (req, res) => {
  try {
    const { landlordId } = req.params;

    // Find all schedules for this landlord and populate with listing and student details
    const schedules = await Schedule.find({ landlordId })
      .populate({
        path: "listingId",
        select: "propertyName images propertyType address city province",
      })
      .populate({
        path: "userId",
        select: "username email phoneNumber",
        match: { role: "user" },
      })
      .sort({ date: 1, time: 1 });

    res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching landlord schedules:", error);
    res.status(500).json({
      message: "Error fetching schedules",
      error: error.message,
    });
  }
};

exports.updateScheduleStatus = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: pending, confirmed, rejected",
      });
    }

    // Find the schedule
    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }

    if (
      String(schedule.landlordId) !== String(req.userId) &&
      req.authRole !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update status
    schedule.status = status;
    await schedule.save();

    // Create notifications and send email
    if (status === "confirmed" || status === "rejected") {
      try {
        // Get user and listing information for notifications
        const [student, landlord, listing] = await Promise.all([
          User.findById(schedule.userId).select("username email").exec(),
          User.findById(schedule.landlordId).select("username email").exec(),
          Listing.findById(schedule.listingId).select("propertyName").exec(),
        ]);

        // Create notification for student
        const studentNotification = new Notification({
          userId: schedule.userId,
          type: "property_update",
          title: `Visit ${status === "confirmed" ? "Confirmed" : "Rejected"}`,
          message: `Your visit to ${
            listing?.propertyName || "the property"
          } has been ${status}`,
          relatedId: schedule._id,
          refModel: "Property",
        });
        await studentNotification.save();

        // Send email notification to student
        if (student && landlord && listing) {
          await sendScheduleStatusEmail(
            student.email,
            student.username,
            landlord.username,
            listing.propertyName,
            schedule.date,
            schedule.time,
            status
          );
        }
      } catch (notificationError) {
        console.error(
          "Error creating schedule notification:",
          notificationError
        );
        // Continue with the response even if notification fails
      }
    }

    res.status(200).json({
      message: `Schedule ${status} successfully`,
      schedule,
    });
  } catch (error) {
    console.error("Error updating schedule status:", error);
    res.status(500).json({
      message: "Error updating schedule",
      error: error.message,
    });
  }
};

// New endpoint to check availability
exports.checkAvailability = async (req, res) => {
  try {
    const { listingId, date, time } = req.query;

    // Validate time is between 7am and 6pm
    const [hours, minutes] = time.split(":").map(Number);
    if (hours < 7 || hours >= 18) {
      return res.status(400).json({
        available: false,
        message: "Booking time must be between 7:00 AM and 6:00 PM",
      });
    }

    // Check if there's a confirmed booking for this time slot
    const existingBooking = await Schedule.findOne({
      listingId,
      date,
      time,
      status: "confirmed",
    });

    if (existingBooking) {
      return res.status(200).json({
        available: false,
        message: "This time slot is already booked.",
      });
    }

    return res.status(200).json({
      available: true,
      message: "Time slot is available",
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({
      available: false,
      message: "Error checking availability",
      error: error.message,
    });
  }
};

// Get available time slots for a specific date
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { listingId, date } = req.query;

    // Find all confirmed bookings for this listing on this date
    const bookedSlots = await Schedule.find({
      listingId,
      date,
      status: "confirmed",
    }).select("time");

    // Generate all possible time slots between 7am and 6pm in 30 min intervals
    const allTimeSlots = [];
    for (let hour = 7; hour < 18; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
      allTimeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    // Convert booked times to a Set for faster lookups
    const bookedTimesSet = new Set(bookedSlots.map((slot) => slot.time));

    // Create a formatted response with availability status for each time slot
    const timeSlots = allTimeSlots.map((time) => ({
      time,
      available: !bookedTimesSet.has(time),
    }));

    res.status(200).json({
      timeSlots,
    });
  } catch (error) {
    console.error("Error getting available time slots:", error);
    res.status(500).json({
      message: "Error getting available time slots",
      error: error.message,
    });
  }
};
