const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const imageUpload = require("../middleware/imageUpload");
const { ensureLandlordAuth } = require("../middleware/ensureLandlordAuth");
const { softVerifyToken } = require("../middleware/verifyToken");

// Add a new listing
router.post(
  "/add-listing",
  ensureLandlordAuth,
  imageUpload.array("propertyImages"),
  listingController.addListing
);

router.get('/', listingController.getListings);

router.get('/popular', listingController.getPopularListings);

router.get('/landlord/:landlordId', softVerifyToken, listingController.getLandlordListings);

router.get('/:id', listingController.getListingById);

router.get('/:id/clicks', listingController.getListingClicks);

router.post('/:id/track-click', listingController.trackListingClick);

router.get('/:id/views-history', listingController.getViewsHistory);

module.exports = router;
