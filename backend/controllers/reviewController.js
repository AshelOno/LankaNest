const Review = require('../models/Review');
const User = require('../models/User');
const Property = require('../models/Property');
const Listing = require('../models/Listing'); // Add this import
const { getSentiment } = require('../utils/reviewDetector');

exports.addReview = async (req, res) => {
    try {
        const { propertyId, ratings, review } = req.body;
        const studentId = req.userId;

        const { sentiment, isSpam, spamReason } = await getSentiment(review);

        // Determine if the review is considered negative
        const isNegative = (sentiment === "negative" || ratings <= 2);

        // Fetch user to update negative review count
        const user = await User.findById(studentId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let status = 'approved';
        if (isSpam) {
            status = 'spam';
        } else if (isNegative) {
            // Increment negative review count
            user.negativeReviewCount += 1;
            await user.save();
            // First five negative reviews are hidden
            status = user.negativeReviewCount <= 5 ? 'hidden' : 'approved';
        }

        let marks = 0;
        if (isSpam) {
            marks = -50;
        } else if (sentiment === "positive") {
            marks = 5;
        } else if (sentiment === "negative") {
            marks = -5;
        }

        const reviewData = {
            propertyId,
            studentId,
            review,
            ratings,
            sentiment,
            marks,
            status,
            spamReason: spamReason
        };

        const newReview = new Review(reviewData);
        await newReview.save();

        // Update the listing's eloRating only if the review is approved (not spam or hidden)
        if (reviewData.status === 'approved') {
            const listing = await Listing.findById(propertyId);
            if (listing) {
                listing.eloRating = listing.eloRating + marks;
                await listing.save();
            }
        }

        let response = {
            success: true,
            message: 'Review processed successfully',
            sentiment: sentiment,
            marks: marks,
            data: reviewData
        };

        if (isSpam) {
            response.message = "Review flagged as spam. Only visible to admins.";
            response.success = false;
            response.spamReason = spamReason;
        }

        res.status(201).json(response);

    } catch (error) {
        console.error('Error in addReview:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review',
            error: error.message,
        });
    }
}

exports.getSpamReviews = async (req, res) => {
    try {
        const spamReviews = await Review.find({ status: 'spam' })
            .populate('studentId', 'username')
            .populate('propertyId', 'propertyName')
            .sort({ createdAt: -1 });

        const formattedReviews = spamReviews.map(review => {
            const studentName = review.studentId ? review.studentId.username : 'Unknown User';
            const studentId = review.studentId ? review.studentId._id : null;
            const propertyName = review.propertyId ? review.propertyId.propertyName : 'Unknown Property';
            const propertyId = review.propertyId ? review.propertyId._id : null;

            return {
                _id: review._id,
                studentId,
                studentName,
                propertyId,
                propertyName,
                review: review.review,
                ratings: review.ratings,
                sentiment: review.sentiment,
                marks: review.marks,
                status: review.status,
                spamReason: review.spamReason || null,
                createdAt: review.createdAt
            };
        });

        res.status(200).json({ success: true, reviews: formattedReviews });
    } catch (error) {
        console.error('Error fetching spam reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch spam reviews', error: error.message });
    }
};

// New controller method for hidden reviews (first five negative reviews)
exports.getHiddenReviews = async (req, res) => {
    try {
        const hiddenReviews = await Review.find({ status: 'hidden' })
            .populate('studentId', 'username')
            .populate('propertyId', 'propertyName')
            .sort({ createdAt: -1 });

        const formattedReviews = hiddenReviews.map(review => {
            const studentName = review.studentId ? review.studentId.username : 'Unknown User';
            const studentId = review.studentId ? review.studentId._id : null;
            const propertyName = review.propertyId ? review.propertyId.propertyName : 'Unknown Property';
            const propertyId = review.propertyId ? review.propertyId._id : null;

            return {
                _id: review._id,
                studentId,
                studentName,
                propertyId,
                propertyName,
                review: review.review,
                ratings: review.ratings,
                sentiment: review.sentiment,
                marks: review.marks,
                status: review.status,
                spamReason: review.spamReason || null,
                createdAt: review.createdAt
            };
        });

        res.status(200).json({ success: true, reviews: formattedReviews });
    } catch (error) {
        console.error('Error fetching hidden reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch hidden reviews', error: error.message });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const allReviews = await Review.find({})
            .populate('studentId', 'username')
            .populate('propertyId', 'propertyName')
            .sort({ createdAt: -1 });

        const formattedReviews = allReviews.map(review => {
            const studentName = review.studentId ? review.studentId.username : 'Unknown User';
            const studentId = review.studentId ? review.studentId._id : null;
            const propertyName = review.propertyId ? review.propertyId.propertyName : 'Unknown Property';
            const propertyId = review.propertyId ? review.propertyId._id : null;

            return {
                _id: review._id,
                studentId,
                studentName,
                propertyId,
                propertyName,
                review: review.review,
                ratings: review.ratings,
                sentiment: review.sentiment,
                marks: review.marks,
                status: review.status,
                spamReason: review.spamReason || null,
                createdAt: review.createdAt
            };
        });

        res.status(200).json({ success: true, reviews: formattedReviews });
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch all reviews', error: error.message });
    }
};

exports.approveReview = async (req, res) => {
    try {
        const { id } = req.params;
        
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // Update review status to approved
        review.status = 'approved';
        await review.save();
        
        // Update the listing's eloRating when approving a previously spam review
        const listing = await Listing.findById(review.propertyId);
        if (listing) {
            listing.eloRating = listing.eloRating + review.marks;
            await listing.save();
            console.log(`Updated listing ${review.propertyId} eloRating to ${listing.eloRating}`);
        }
        
        res.status(200).json({
            success: true,
            message: 'Review approved successfully'
        });
    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve review',
            error: error.message
        });
    }
};

// Also need to handle removing the marks if a review is deleted
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }
        
        // If the review was approved, remove its marks from the listing's eloRating
        if (review.status === 'approved') {
            const listing = await Listing.findById(review.propertyId);
            if (listing) {
                listing.eloRating = listing.eloRating - review.marks;
                await listing.save();
                console.log(`Updated listing ${review.propertyId} eloRating to ${listing.eloRating} after review deletion`);
            }
        }
        
        // Delete the review
        await Review.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
};

exports.getListingReviews = async (req, res) => {
    try {
        const { listingId } = req.params;
        
        const reviews = await Review.find({ 
            propertyId: listingId,
            status: 'approved'
        })
        .populate('studentId', 'username profilePicture')
        .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Error fetching listing reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews for this listing',
            error: error.message
        });
    }
};

exports.toggleHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.userId;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        const voteIndex = review.helpfulVotes.indexOf(userId);
        if (voteIndex === -1) {
            review.helpfulVotes.push(userId);
            // Increment marks of the review when someone finds it helpful
            review.marks += 1;
        } else {
            review.helpfulVotes.splice(voteIndex, 1);
            review.marks -= 1;
        }

        await review.save();
        res.status(200).json({ success: true, helpfulCount: review.helpfulVotes.length, isHelpful: voteIndex === -1 });
    } catch (error) {
        console.error('Error toggling helpful vote:', error);
        res.status(500).json({ success: false, message: 'Failed to vote' });
    }
};

exports.addLandlordReply = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reply } = req.body;

        const review = await Review.findById(reviewId).populate('propertyId');
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        if (
            String(review.propertyId?.landlord) !== String(req.userId) &&
            req.authRole !== "admin"
        ) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        review.landlordReply = reply;
        await review.save();

        res.status(200).json({ success: true, message: 'Reply added successfully', reply });
    } catch (error) {
        console.error('Error adding landlord reply:', error);
        res.status(500).json({ success: false, message: 'Failed to add reply' });
    }
};

exports.getReviewStats = async (req, res) => {
    try {
        const { listingId } = req.params;
        const reviews = await Review.find({ propertyId: listingId, status: 'approved' });

        const total = reviews.length;
        const average = total > 0 ? reviews.reduce((acc, r) => acc + r.ratings, 0) / total : 0;
        
        const distribution = {
            5: reviews.filter(r => r.ratings === 5).length,
            4: reviews.filter(r => r.ratings === 4).length,
            3: reviews.filter(r => r.ratings === 3).length,
            2: reviews.filter(r => r.ratings === 2).length,
            1: reviews.filter(r => r.ratings === 1).length,
        };

        res.status(200).json({
            success: true,
            stats: {
                total,
                average: average.toFixed(1),
                distribution
            }
        });
    } catch (error) {
        console.error('Error getting review stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};
