const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const { getDashboard, getAnalytics, updateStock } = require('../controllers/sellerDashboardController');
const { getSellerOrders, getSellerOrder, updateOrderStatus } = require('../controllers/sellerOrderController');
const { changePassword } = require('../controllers/sellerAuthController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const Seller = require('../models/Seller');
const { sendSubscriptionStatusEmail } = require('../utils/emailUtils');

// ── Multer for logo upload ──
const storage = multer.diskStorage({
    destination: (req, file, cb) =>
        cb(null, path.join(__dirname, '../public/uploads/logos/')),

    filename: (req, file, cb) =>
        cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
});

// ── Profile update with optional logo ──
const updateProfile = async (req, res, next) => {
    try {
        const { brandName, description, category, phone } = req.body;

        const updates = {};

        if (brandName) updates.brandName = brandName;
        if (description) updates.description = description;
        if (category) updates.category = category;
        if (phone) updates.phone = phone;
        if (req.file) updates.logo = `/uploads/logos/${req.file.filename}`;

        const seller = await Seller.findByIdAndUpdate(
            req.user._id,
            updates,
            {
                new: true,
                runValidators: true,
            }
        ).select('-password -resetToken -resetTokenExpiry');

        return res.json({
            success: true,
            data: seller,
        });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────
// Seller submits payment
// POST /api/seller/payment-submitted
// ─────────────────────────────────────────────
router.post('/payment-submitted', protect, sellerOnly, async (req, res, next) => {
    try {
        const { plan, amount } = req.body;

        const validPlans = ['basic', 'standard', 'premium'];

        if (!validPlans.includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan',
            });
        }

        const seller = await Seller.findByIdAndUpdate(
            req.user._id,
            {
                subscriptionPlan: plan,
                subscriptionPaidAmount: Number(amount) || 0,
                subscriptionStatus: 'pending',
                subscriptionPaidAt: new Date(),
                isApproved: false,
            },
            {
                new: true,
            }
        ).select('-password -resetToken -resetTokenExpiry');

        return res.json({
            success: true,
            message: 'Payment submission recorded. Awaiting admin approval.',
            data: seller,
        });
    } catch (err) {
        next(err);
    }
});

// ─────────────────────────────────────────────
// Admin approves seller subscription
// PATCH /api/seller/admin/approve-subscription/:sellerId
// ─────────────────────────────────────────────
router.patch('/admin/approve-subscription/:sellerId', adminMiddleware, async (req, res, next) => {
    try {
        const { paidAmount } = req.body;

        const updates = {
            subscriptionStatus: 'active',
            isApproved: true,
            approvedAt: new Date(),
            rejectedAt: null,
            rejectionReason: '',
            discountEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        };

        if (paidAmount !== undefined && paidAmount !== null && paidAmount !== '') {
            updates.subscriptionPaidAmount = Number(paidAmount);
            updates.subscriptionPaidAt = new Date();
        }

        const seller = await Seller.findByIdAndUpdate(
            req.params.sellerId,
            updates,
            {
                new: true,
            }
        ).select('-password -resetToken -resetTokenExpiry');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        try {
            await sendSubscriptionStatusEmail({
                to: seller.email,
                brandName: seller.brandName,
                status: 'active',
            });
        } catch (emailErr) {
            console.error('Approval email failed:', emailErr.message);
        }

        return res.json({
            success: true,
            message: 'Seller subscription activated.',
            data: seller,
        });
    } catch (err) {
        next(err);
    }
});

// ─────────────────────────────────────────────
// Admin rejects seller subscription
// PATCH /api/seller/admin/reject-subscription/:sellerId
// ─────────────────────────────────────────────
router.patch('/admin/reject-subscription/:sellerId', adminMiddleware, async (req, res, next) => {
    try {
        const { reason } = req.body;

        const seller = await Seller.findByIdAndUpdate(
            req.params.sellerId,
            {
                subscriptionStatus: 'rejected',
                isApproved: false,
                rejectionReason: reason || 'Your payment or application could not be verified.',
                rejectedAt: new Date(),
            },
            {
                new: true,
            }
        ).select('-password -resetToken -resetTokenExpiry');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found',
            });
        }

        try {
            await sendSubscriptionStatusEmail({
                to: seller.email,
                brandName: seller.brandName,
                status: 'rejected',
            });
        } catch (emailErr) {
            console.error('Rejection email failed:', emailErr.message);
        }

        return res.json({
            success: true,
            message: 'Seller subscription rejected.',
            data: seller,
        });
    } catch (err) {
        next(err);
    }
});

// ─────────────────────────────────────────────
// Seller protected routes
// ─────────────────────────────────────────────
router.use(protect, sellerOnly);

router.put('/profile', upload.single('logo'), updateProfile);
router.put('/change-password', changePassword);

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

router.patch('/products/:productId/stock', updateStock);

router.get('/orders', getSellerOrders);
router.get('/orders/:id', getSellerOrder);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;