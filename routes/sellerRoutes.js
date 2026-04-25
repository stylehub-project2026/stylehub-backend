const express = require('express');
const router = express.Router();

const { getDashboard, getAnalytics, updateStock } = require('../controllers/sellerDashboardController');
const { getSellerOrders, getSellerOrder, updateOrderStatus } = require('../controllers/sellerOrderController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

router.use(protect, sellerOnly);

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.patch('/products/:productId/stock', updateStock);
router.get('/orders', getSellerOrders);
router.get('/orders/:id', getSellerOrder);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;