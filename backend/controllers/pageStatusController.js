const PageStatus = require("../models/PageStatus");

// Get all page statuses
exports.getAllPageStatus = async (req, res) => {
    try {
        const pageStatuses = await PageStatus.find().sort({ path: 1 });

        res.status(200).json({
            success: true,
            data: pageStatuses
        });
    } catch (error) {
        console.error("Error fetching page statuses:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching page statuses",
            error: error.message
        });
    }
};

// Update a page's status
exports.updatePageStatus = async (req, res) => {
    try {
        const { path, isOnline } = req.body;

        if (!path || isOnline === undefined) {
            return res.status(400).json({
                success: false,
                message: "Path and status are required"
            });
        }

        // Find and update or create if not exists (upsert)
        const pageStatus = await PageStatus.findOneAndUpdate(
            { path },
            {
                isOnline,
                updatedBy: req.userId,
                updatedAt: new Date(),
                $setOnInsert: { name: req.body.name || path }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({
            success: true,
            message: `Page ${path} is now ${isOnline ? 'online' : 'in maintenance mode'}`,
            data: pageStatus
        });
    } catch (error) {
        console.error("Error updating page status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating page status",
            error: error.message
        });
    }
};

// Initialize default page statuses
exports.initializeDefaultPages = async (req, res) => {
    try {
        const defaultPages = [
            { path: '/', name: 'Home Page' },
            { path: '/search', name: 'Search Page' },
            { path: '/all-listings', name: 'All Listings' },
            { path: '/auth/user-signup', name: 'Student Signup' },
            { path: '/auth/user-signin', name: 'Student Login' },
            { path: '/auth/houseowner-signup', name: 'Landlord Signup' },
            { path: '/auth/houseowner-signin', name: 'Landlord Login' },
            { path: '/privacy-policy', name: 'Privacy Policy' }
        ];

        // Use bulkWrite for more efficient operation
        await PageStatus.bulkWrite(
            defaultPages.map(page => ({
                updateOne: {
                    filter: { path: page.path },
                    update: {
                        $setOnInsert: {
                            path: page.path,
                            name: page.name,
                            isOnline: true
                        }
                    },
                    upsert: true
                }
            }))
        );

        res.status(200).json({
            success: true,
            message: "Default pages initialized successfully"
        });
    } catch (error) {
        console.error("Error initializing default pages:", error);
        res.status(500).json({
            success: false,
            message: "Error initializing default pages",
            error: error.message
        });
    }
};