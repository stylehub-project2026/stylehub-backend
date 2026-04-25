const express = require('express');
const router = express.Router();

const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.get('/', protect, customerOnly, getWishlist);
router.post('/', protect, customerOnly, addToWishlist);
router.delete('/:productId', protect, customerOnly, removeFromWishlist);

module.exports = router;
