const University = require("../models/University");
const Listing = require("../models/Listing");
const User = require("../models/User");
const mongoose = require('mongoose');

exports.searchByUniversity = async (req, res) => {
    try {
        console.log("Request params:", req.params);
        console.log("Request query:", req.query);

        let searchQuery = req.query.query || req.query.q;
        console.log("Search query:", searchQuery);

        let universityId = req.params.universityId || req.query.id || req.query.universityId;
        console.log("Extracted universityId:", universityId);

        let university;

        // If we have a search query, try to find university by name or alias first
        if (searchQuery && searchQuery.trim()) {
            console.log("Searching for university by name/query:", searchQuery);
            university = await University.findOne({
                $or: [
                    { name: new RegExp(searchQuery, 'i') },
                    { aliases: new RegExp(searchQuery, 'i') }
                ]
            });

            console.log("University found by search query:", university ? university.name : "None");
        }

        // If not found by search query and we have an ID, try by ID
        if (!university && universityId && mongoose.Types.ObjectId.isValid(universityId)) {
            university = await University.findById(universityId);
            console.log("University found by ID:", university ? university.name : "None");
        }

        if (!university) {
            const universities = await University.find().limit(1);
            if (universities && universities.length > 0) {
                university = universities[0];
                console.log("Using fallback university:", university.name);
            }
        }

        if (!university) {
            return res.status(404).json({
                success: false,
                message: "No universities found in the system. Please add universities first.",
            });
        }

        console.log("Final university used:", university.name);

        const activeUsers = await User.find({
            role: 'landlord',
            isFlagged: { $ne: true }
        }).select('_id');

        const activeLandlordIds = activeUsers.map(user => user._id);

        console.log(`Found ${activeLandlordIds.length} active landlords`);

        const listings = await Listing.find({
            nearestUniversity: university._id,
            landlord: { $in: activeLandlordIds }
        })
            .populate({
                path: "landlord",
                select: "username email phoneNumber isFlagged"
            })
            .populate("nearestUniversity", "name location")
            .sort({ eloRating: -1 }) // Sort by popularity 
            .exec();

        console.log(`Found ${listings.length} listings for university: ${university.name} (ID: ${university._id})`);

        res.status(200).json({
            success: true,
            data: {
                university,
                listings: listings,
            },
        });
    } catch (error) {
        console.error("Error in searchByUniversity:", error);
        res.status(500).json({
            success: false,
            message: "Error searching by university",
            error: error.message,
        });
    }
};

exports.searchByLocation = async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
            });
        }

        const allListings = await Listing.find()
            .populate({
                path: "landlord",
                select: "username email phoneNumber isFlagged",
                match: { isFlagged: { $ne: true } }
            })
            .populate("nearestUniversity", "name location");

        const activeListings = allListings.filter(listing => listing.landlord);

        const nearbyListings = activeListings.filter(listing => {
            const distance = calculateDistance(
                parseFloat(lat),
                parseFloat(lng),
                listing.coordinates.latitude,
                listing.coordinates.longitude
            );
            return distance <= parseFloat(radius);
        });

        res.status(200).json({
            success: true,
            data: nearbyListings,
        });
    } catch (error) {
        console.error("Error in searchByLocation:", error);
        res.status(500).json({
            success: false,
            message: "Error searching by location",
            error: error.message,
        });
    }
};

// Add a new method to get all listings (replacing the need for the listing controller's getListings)
exports.getAllListings = async (req, res) => {
    try {
        const listings = await Listing.find()
            .populate({
                path: "landlord",
                select: "username email phoneNumber isFlagged",
                match: { isFlagged: { $ne: true } }
            })
            .populate("nearestUniversity", "name location")
            .sort({ eloRating: -1 })
            .exec();

        const filteredListings = listings.filter(listing => listing.landlord);

        res.status(200).json({
            success: true,
            data: filteredListings
        });
    } catch (error) {
        console.error("Error fetching all listings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching all listings",
            error: error.message,
        });
    }
};

// Add a debug endpoint to check universities in the database
exports.getAllUniversities = async (req, res) => {
    try {
        const universities = await University.find();

        console.log(`Found ${universities.length} universities in the database`);

        res.status(200).json({
            success: true,
            count: universities.length,
            data: universities
        });
    } catch (error) {
        console.error("Error fetching universities:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching universities",
            error: error.message
        });
    }
};

// Add a function to search universities by name
exports.searchUniversityByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least 2 characters for university name search",
            });
        }

        const universities = await University.find({
            $or: [
                { name: new RegExp(name, 'i') },
                { aliases: new RegExp(name, 'i') }
            ]
        });

        console.log(`Found ${universities.length} universities matching "${name}"`);

        res.status(200).json({
            success: true,
            count: universities.length,
            data: universities
        });
    } catch (error) {
        console.error("Error searching universities by name:", error);
        res.status(500).json({
            success: false,
            message: "Error searching universities",
            error: error.message
        });
    }
};

// Helper function to calculate distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}
