const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // Make optional in case of anonymous feedback
    },
    userType: {
        type: String,
        enum: ['student', 'landlord', 'admin', 'anonymous'],
        required: true,
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    feedbackType: {
        type: String,
        enum: ['suggestion', 'bug', 'compliment', 'other'],
        required: true,
    },
    feedback: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        default: 'app_sidebar',
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'addressed', 'closed'],
        default: 'pending',
    },
    isResolved: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
