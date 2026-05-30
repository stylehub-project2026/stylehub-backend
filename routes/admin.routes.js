const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const {
    adminLogin,
    getSellers,
    approveSeller,
    deleteSeller,
    getCustomers,
    deleteCustomer,
    getCommissions,
    getSubscriptionRevenue,
} = require('../controllers/adminController');

router.post('/login', adminLogin);
router.get('/sellers', adminMiddleware, getSellers);
router.put('/sellers/:id/approve', adminMiddleware, approveSeller);
router.delete('/sellers/:id', adminMiddleware, deleteSeller);
router.get('/customers', adminMiddleware, getCustomers);
router.delete('/customers/:id', adminMiddleware, deleteCustomer);
router.get('/commissions', adminMiddleware, getCommissions);
router.get('/subscription-revenue', adminMiddleware, getSubscriptionRevenue);

module.exports = router;