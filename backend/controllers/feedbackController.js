const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');

// Submit new feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { userId, userType, rating, feedbackType, feedback, source } = req.body;

        // Create the feedback document
        const newFeedback = new Feedback({
            userId: userId || null,
            userType: userType || 'anonymous',
            rating: rating || 0,
            feedbackType,
            feedback,
            source: source || 'app_sidebar',
        });

        // Save the feedback to the database
        await newFeedback.save();

        // Return success response
        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: newFeedback,
        });
    } catch (error) {
        console.error('Error in submitFeedback:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message,
        });
    }
};

// Get all feedback (Admin only)
exports.getAllFeedback = async (req, res) => {
    try {
        // Add pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get filters from query params
        const { userType, feedbackType, status } = req.query;

        // Build filter object
        const filter = {};
        if (userType) filter.userType = userType;
        if (feedbackType) filter.feedbackType = feedbackType;
        if (status) filter.status = status;

        // Get total count for pagination
        const total = await Feedback.countDocuments(filter);

        // Get feedback with filters and pagination
        const feedbacks = await Feedback.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            count: feedbacks.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: feedbacks,
        });
    } catch (error) {
        console.error('Error in getAllFeedback:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve feedback',
            error: error.message,
        });
    }
};

// Update feedback status (Admin only)
exports.updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isResolved } = req.body;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feedback ID format',
            });
        }

        // Find and update the feedback
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            id,
            {
                status,
                isResolved: isResolved !== undefined ? isResolved : undefined,
            },
            { new: true, runValidators: true }
        );

        if (!updatedFeedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Feedback status updated successfully',
            data: updatedFeedback,
        });
    } catch (error) {
        console.error('Error in updateFeedbackStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update feedback status',
            error: error.message,
        });
    }
};
