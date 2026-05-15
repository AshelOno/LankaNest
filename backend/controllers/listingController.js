const Listing = require("../models/Listing");
const User = require("../models/User"); // Add User model import
const { getIO } = require("../config/socket");
const { uploadListingImage } = require("../services/storageService");
const {
  calculateInitialEloRating,
  calculateClickEloIncrease,
} = require("../utils/eloCalculator");
const { checkListingLimit } = require("./subscriptionController");

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper function to check listing limit for free plan users
async function checkListingLimitForUser(userId) {
  // Check if user has premium subscription
  const isPremium = await checkListingLimit(userId);

  if (isPremium) {
    // Premium users have unlimited listings
    return { canAddListing: true };
  }

  // For free plan users, check existing listing count
  const listingsCount = await Listing.countDocuments({ landlord: userId });

  if (listingsCount >= 1) {
    return {
      canAddListing: false,
      message:
        "Free plan users can only create 1 listing. Please upgrade to Premium for unlimited active listings.",
    };
  }

  return { canAddListing: true };
}

exports.addListing = async (req, res) => {
  try {
    const landlord = req.user;
    if (!landlord) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has reached their listing limit
    const limitCheck = await checkListingLimitForUser(landlord._id);
    if (!limitCheck.canAddListing) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
      });
    }

    // Debug log
    // console.log('Files received:', req.files);
    // console.log('Body received:', req.body);

    const {
      propertyName,
      propertyType,
      builtYear,
      size,
      bedrooms,
      bathrooms,
      garage,
      monthlyRent,
      description,
      address,
      city,
      province,
      postalCode,
      nearestUniversity,
      coordinates,
      "university-distance": universityDistance, // Extract university distance
      genderPreference, // Process the new field
    } = req.body;

    // Validate gender preference
    if (
      !genderPreference ||
      !["boys", "girls", "mixed"].includes(genderPreference)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid gender preference. Must be one of: boys, girls, mixed",
      });
    }

    const numericFields = [
      "size",
      "bedrooms",
      "bathrooms",
      "garage",
      "monthlyRent",
      "university-distance",
    ];
    numericFields.forEach((field) => {
      if (req.body[field]) {
        req.body[field] = Number(req.body[field]);
      }
    });

    let parsedCoordinates;
    try {
      parsedCoordinates =
        typeof coordinates === "string" ? JSON.parse(coordinates) : coordinates;
    } catch (err) {
      return res.status(400).json({ message: "Invalid coordinates format" });
    }

    const imageUrls = [];

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images were uploaded" });
    }

    for (const file of req.files) {
      try {
        const uploadResult = await uploadListingImage(file);
        imageUrls.push(uploadResult.url || uploadResult.key);
      } catch (uploadError) {
        console.error("S3 upload error:", uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }
    }

    // console.log('Image URLs:', imageUrls);

    // Calculate initial ELO rating using the utility function
    const initialEloRating = calculateInitialEloRating(req.body);

    const newListing = new Listing({
      propertyName,
      propertyType,
      builtYear,
      size: req.body.size,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      garage: req.body.garage,
      monthlyRent: req.body.monthlyRent,
      description,
      address,
      city,
      province,
      postalCode,
      nearestUniversity,
      universityDistance: req.body["university-distance"], // Add university distance
      coordinates: parsedCoordinates,
      images: imageUrls,
      landlord: landlord._id,
      eloRating: initialEloRating,
      genderPreference, // Add gender preference
    });

    await newListing.save();
    // console.log('Saved listing:', newListing);

    res
      .status(201)
      .json({ message: "Listing added successfully", listing: newListing });
  } catch (err) {
    console.error("Error details:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
      details: err.errors,
    });
  }
};

exports.getListings = async (req, res) => {
  try {
    const {
      q,
      city,
      university,
      minPrice,
      maxPrice,
      genderPreference,
      propertyType,
      beds,
    } = req.query;

    const query = { isHeldForPayment: { $ne: true }, isFlagged: { $ne: true } };
    if (city) query.city = new RegExp(escapeRegExp(city), "i");
    if (genderPreference) {
      query.genderPreference = { $in: [genderPreference, "mixed"] };
    }
    if (propertyType) query.propertyType = new RegExp(`^${escapeRegExp(propertyType)}$`, "i");
    if (minPrice || maxPrice) {
      query.monthlyRent = {};
      if (minPrice) query.monthlyRent.$gte = Number(minPrice);
      if (maxPrice) query.monthlyRent.$lte = Number(maxPrice);
    }
    if (beds) {
      query.bedrooms = beds === "4+" ? { $gte: 4 } : Number(beds);
    }

    const listings = await Listing.find(query)
      .populate({
        path: "landlord",
        select: "username email phoneNumber isFlagged",
        match: { isFlagged: { $ne: true } }, // Only include listings where landlord is not flagged
      })
      .populate("nearestUniversity", "name location")
      .sort({ eloRating: -1 })
      .exec();

    // Filter out listings where landlord is null (due to the match condition)
    const searchText = String(q || university || "").trim().toLowerCase();
    const filteredListings = listings.filter((listing) => {
      if (!listing.landlord) return false;
      if (!searchText) return true;

      const searchable = [
        listing.propertyName,
        listing.address,
        listing.city,
        listing.province,
        listing.propertyType,
        listing.genderPreference,
        listing.description,
        listing.nearestUniversity?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText
        .split(/\s+/)
        .filter(Boolean)
        .every((word) => searchable.includes(word));
    });

    res.status(200).json(filteredListings);
  } catch (err) {
    console.error("Error fetching listings:", err);
    res.status(500).json({
      message: "Error fetching listings",
      error: err.message,
    });
  }
};

exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate({
        path: "landlord",
        select: "username email phoneNumber isFlagged",
      })
      .populate("nearestUniversity", "name location")
      .exec();

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // If landlord is flagged or listing is flagged, don't show the listing
    if ((listing.landlord && listing.landlord.isFlagged) || listing.isFlagged) {
      return res.status(403).json({
        message: "This listing is currently unavailable",
      });
    }

    res.status(200).json(listing);
  } catch (err) {
    console.error("Error fetching listing:", err);
    res.status(500).json({
      message: "Error fetching listing",
      error: err.message,
    });
  }
};

exports.trackListingClick = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    // Increment the views count
    listing.views += 1;

    // Update the ELO rating based on the click with dynamic calculation
    const calculatedEloIncrease = calculateClickEloIncrease(
      listing.eloRating,
      listing
    );

    // Add fixed 2 additional marks per click
    const bonusMarks = 2;
    listing.eloRating = calculatedEloIncrease + bonusMarks;

    await listing.save();

    // Emit socket event for real-time updates
    const io = getIO();
    io.emit("listing_update", {
      listingId: id,
      clickCount: listing.views,
      eloRating: listing.eloRating,
    });

    return res.status(200).json({
      success: true,
      clicks: listing.views,
      eloRating: listing.eloRating,
    });
  } catch (err) {
    console.error("Error tracking click:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error tracking click" });
  }
};

exports.getPopularListings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const popularListings = await Listing.find({ isFlagged: { $ne: true } })
      .populate({
        path: "landlord",
        select: "username email phoneNumber isFlagged",
        match: { isFlagged: { $ne: true } },
      })
      .populate("nearestUniversity", "name location")
      .sort({ eloRating: -1 })
      .limit(limit * 2)
      .exec();

    const filteredListings = popularListings.filter(
      (listing) => listing.landlord
    );

    const limitedListings = filteredListings.slice(0, limit);

    res.status(200).json(limitedListings);
  } catch (err) {
    console.error("Error fetching popular listings:", err);
    res.status(500).json({
      message: "Error fetching popular listings",
      error: err.message,
    });
  }
};

exports.getLandlordListings = async (req, res) => {
  try {
    const { landlordId } = req.params;

    if (!landlordId) {
      return res.status(400).json({
        message: "Landlord ID is required",
      });
    }

    // Check if landlord is flagged
    const landlord = await User.findById(landlordId);
    if (!landlord) {
      return res.status(404).json({
        message: "Landlord not found",
      });
    }

    const isAdminOrOwner =
      req.user?._id?.toString() === landlordId ||
      req.userId?.toString() === landlordId ||
      req.user?.role === "admin";

    if (!isAdminOrOwner && landlord.isFlagged) {
      return res.status(200).json([]);
    }

    const query = { landlord: landlordId };
    const limit = parseInt(req.query.limit) || 0;

    let listingsQuery = Listing.find(query)
      .populate("landlord", "username email phoneNumber isFlagged") // Add isFlagged to the populated fields
      .populate("nearestUniversity", "name location")
      .sort({ createdAt: -1 });

    if (limit > 0) {
      listingsQuery = listingsQuery.limit(limit);
    }

    const listings = await listingsQuery.exec();

    // If user is owner or admin, include "held" status for each listing
    if (isAdminOrOwner) {
      // Add isHeld flag to each listing in the response for UI display
      const listingsWithStatus = listings.map((listing) => {
        const listingObj = listing.toObject();
        listingObj.isHeld = listing.isHeldForPayment || false;
        return listingObj;
      });

      return res.status(200).json(listingsWithStatus);
    }

    // For non-owners, filter out held listings
    const visibleListings = listings.filter(
      (listing) => !listing.isHeldForPayment
    );
    res.status(200).json(visibleListings);
  } catch (err) {
    console.error("Error fetching landlord listings:", err);
    res.status(500).json({
      message: "Error fetching landlord listings",
      error: err.message,
    });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate gender preference if it's being updated
    if (
      updates.genderPreference &&
      !["boys", "girls", "mixed"].includes(updates.genderPreference)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid gender preference. Must be one of: boys, girls, mixed",
      });
    }

    // Find the listing by ID and update it
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    // Check if user is authorized to update this listing
    if (
      req.user.role !== "admin" &&
      listing.landlord.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this listing",
      });
    }

    // Apply updates to the listing
    Object.keys(updates).forEach((key) => {
      if (key !== "landlord" && key !== "_id") {
        // Prevent changing landlord or _id
        listing[key] = updates[key];
      }
    });

    await listing.save();

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      listing,
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update listing",
      error: error.message,
    });
  }
};

exports.getListingClicks = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    res.status(200).json({
      success: true,
      clicks: listing.views || 0,
      eloRating: listing.eloRating || 1400,
    });
  } catch (err) {
    console.error("Error fetching listing clicks:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching listing clicks" });
  }
};

// Add this new endpoint to retrieve historical views data
exports.getViewsHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Listing not found" });
    }

    // Get historical click data - this assumes you've added a viewsHistory field to your schema
    // If you don't have this field, you can implement a solution that approximates historical data
    // based on the total views and creation date

    const viewsHistory = listing.viewsHistory || [];

    // If no history exists, generate simulated weekly data
    if (!viewsHistory.length) {
      const weeks = 8;
      const result = [];
      const totalViews = listing.views || 0;
      let remainingViews = totalViews;
      const now = new Date();
      const baseViewsPerWeek = Math.floor(totalViews / weeks);

      for (let i = 0; i < weeks; i++) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() - (weeks - 1 - i) * 7);

        let weekViews;
        if (i === weeks - 1) {
          weekViews = remainingViews;
        } else {
          const weightFactor = 0.7 + (i / weeks) * 0.6;
          weekViews = Math.floor(
            baseViewsPerWeek * weightFactor * (0.8 + Math.random() * 0.4)
          );
          weekViews = Math.min(weekViews, remainingViews);
          remainingViews -= weekViews;
        }

        result.push({
          week: `Week ${i + 1}`,
          date: weekDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          clicks: weekViews,
        });
      }

      return res.status(200).json({
        success: true,
        history: result,
      });
    }

    return res.status(200).json({
      success: true,
      history: viewsHistory,
    });
  } catch (err) {
    console.error("Error fetching views history:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching views history" });
  }
};
