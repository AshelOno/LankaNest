const express = require('express');
const router = express.Router();
const {addReview, getSpamReviews, getHiddenReviews, getAllReviews, approveReview, deleteReview, getListingReviews, toggleHelpful, addLandlordReply, getReviewStats} = require('../controllers/reviewController');
const {verifyToken} = require('../middleware/verifyToken');
const { requireAdmin } = require("../middleware/requireAdmin");

// Public routes
router.post('/add-review', verifyToken, addReview);
router.get('/listing-reviews/:listingId', getListingReviews);

router.post('/toggle-helpful/:reviewId', verifyToken, toggleHelpful);
router.patch('/landlord-reply/:reviewId', verifyToken, addLandlordReply);
router.get('/stats/:listingId', getReviewStats);

// Admin routes
router.get('/admin/hidden-reviews', verifyToken, requireAdmin, getHiddenReviews);
router.get('/admin/spam-reviews', verifyToken, requireAdmin, getSpamReviews);
router.get('/admin/all-reviews', verifyToken, requireAdmin, getAllReviews);
router.delete('/admin/delete/:id', verifyToken, requireAdmin, deleteReview);
module.exports = router;
