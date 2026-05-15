const express = require("express");
const router = express.Router();
const { 
    searchByUniversity, 
    searchByLocation,
    getAllListings
} = require("../controllers/searchController");

// Search routes
router.get("/university", searchByUniversity);
router.get("/location", searchByLocation);
router.get("/all-listings", getAllListings);

module.exports = router;
