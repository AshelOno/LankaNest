const PageStatus = require('../models/PageStatus');

/**
 * Middleware to check if a page is currently available or in maintenance mode
 */
exports.checkPageStatus = async (req, res, next) => {
    try {
        // Skip check for admin routes and API routes
        if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
            return next();
        }

        // Find the page status
        const pageStatus = await PageStatus.findOne({ path: req.path });

        // If page exists and is offline, send maintenance response
        if (pageStatus && !pageStatus.isOnline) {
            return res.status(503).json({
                success: false,
                maintenance: true,
                message: `The page ${req.path} is currently under maintenance. Please try again later.`
            });
        }

        // Continue with the request
        next();
    } catch (error) {
        console.error('Error checking page status:', error);
        // In case of error, we allow the request to proceed
        next();
    }
};