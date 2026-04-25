const express = require('express');
const router = express.Router();

const { createOrder, getMyOrders, getOrder, cancelOrder } = require('../controllers/orderController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.post('/', protect, customerOnly, createOrder);
router.get('/my-orders', protect, customerOnly, getMyOrders);
router.get('/:id', protect, customerOnly, getOrder);
router.patch('/:id/cancel', protect, customerOnly, cancelOrder);

module.exports = router;