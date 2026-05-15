const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// Existing routes
router.get("/university/:universityId", searchController.searchByUniversity);
router.get("/location", searchController.searchByLocation);
router.get("/all-listings", searchController.getAllListings);
router.get("/universities", searchController.getAllUniversities);
router.get("/university-search", searchController.searchUniversityByName);

// Add a more flexible university search endpoint
router.get("/university", searchController.searchByUniversity); // This will use query params

module.exports = router;
