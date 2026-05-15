const BookMark = require("../models/BookMark");

exports.addBookMark = async (req, res) => {
    try {
        const { listing } = req.body;
        const user = req.userId;

        // Validate request body
        if (!listing || !user) {
            return res.status(400).json({ message: "listing and user IDs are required." });
        }

        // Check for duplicate bookmark
        const existingBookMark = await BookMark.findOne({ listing, user });
        if (existingBookMark) {
            return res.status(409).json({ message: "Bookmark already exists." });
        }

        // Create and save the bookmark
        const newBookMark = new BookMark({ listing, user });
        await newBookMark.save();

        res.status(201).json({ 
            success: true,
            message: "Bookmark added successfully.", 
            bookmark: newBookMark 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "An error occurred while adding the bookmark.", 
            error: error.message 
        });
    }
};

exports.getBookMark = async (req, res) => {
    try {
        const user = req.query.user || req.userId;

        // Validate query parameter
        if (!user) {
            return res.status(400).json({ message: "user ID is required." });
        }

        if (String(user) !== String(req.userId) && req.authRole !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Fetch bookmarks for the user
        const bookMarks = await BookMark.find({ user }).populate("listing");

        res.status(200).json({ 
            success: true,
            message: "Bookmarks fetched successfully.", 
            bookmarks: bookMarks 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "An error occurred while fetching bookmarks.", 
            error: error.message 
        });
    }
};

// Function to fetch bookmarks by user
exports.getBookmarksByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const bookmarks = await BookMark.find({ user: userId }).populate("listing");
        res.status(200).json(bookmarks);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Failed to fetch bookmarks", 
            error: error.message 
        });
    }
};

// Add function to delete a bookmark
exports.deleteBookmark = async (req, res) => {
    const { bookmarkId } = req.params;
    
    try {
        const bookmark = await BookMark.findById(bookmarkId);

        if (!bookmark) {
            return res.status(404).json({ 
                success: false,
                message: "Bookmark not found" 
            });
        }

        if (String(bookmark.user) !== String(req.userId) && req.authRole !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        await BookMark.findByIdAndDelete(bookmarkId);
        
        res.status(200).json({ 
            success: true,
            message: "Bookmark removed successfully" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Failed to remove bookmark", 
            error: error.message 
        });
    }
};
