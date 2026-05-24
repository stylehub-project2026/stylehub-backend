// backend/routes/sellerProfileRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const { protect, sellerOnly } = require('../middleware/authMiddleware');
const Seller = require('../models/Seller');
const { changePassword } = require('../controllers/sellerAuthController');

const storage = new CloudinaryStorage({
    cloudinary,
    params: { folder: 'stylehub/logos', allowed_formats: ['jpg', 'png', 'webp'] },
});
const upload = multer({ storage });

// PUT /api/sellers/profile
router.put('/profile', protect, sellerOnly, upload.single('logo'), async (req, res, next) => {
    try {
        const { brandName, description } = req.body;
        const update = { brandName, description };
        if (req.file) update.logo = req.file.path;

        const seller = await Seller.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
        res.json({ success: true, data: { seller, logo: seller.logo } });
    } catch (err) {
        next(err);
    }
});

// PUT /api/sellers/change-password
router.put('/change-password', protect, sellerOnly, changePassword);

// GET /api/sellers
router.get('/', async (req, res, next) => {
    try {
        const sellers = await Seller.find({ isApproved: true }).select('brandName logo _id');
        res.json({ success: true, data: sellers });
    } catch (err) {
        next(err);
    }
});

module.exports = router;