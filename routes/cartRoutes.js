const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.use(protect, customerOnly);
router.get('/', getCart);
router.post('/', addToCart);
router.put('/items/:itemId', updateCartItem);
router.delete('/items/:itemId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;