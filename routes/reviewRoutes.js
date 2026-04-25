const express = require('express');
const router = express.Router();
const { addReview, getProductReviews, updateReview, deleteReview } = require('../controllers/reviewController');
const { validateCreateReview, validateUpdateReview } = require('../validators/reviewValidator');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', protect, customerOnly, validateCreateReview, addReview);
router.put('/:reviewId', protect, customerOnly, validateUpdateReview, updateReview);
router.delete('/:reviewId', protect, customerOnly, deleteReview);

module.exports = router;