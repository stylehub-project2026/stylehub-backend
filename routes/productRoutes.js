const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');


const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getMyProducts } = require('../controllers/productController');
const { addReview, getProductReviews } = require('../controllers/reviewController');
const { protect, sellerOnly, customerOnly } = require('../middleware/authMiddleware');

// ─── MULTER SETUP ───
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── ROUTES ───
router.get('/', getProducts);
router.get('/my', protect, sellerOnly, getMyProducts);
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', protect, customerOnly, addReview);
router.get('/:id', getProduct);
router.post('/', protect, sellerOnly, upload.array('images', 5), createProduct);
router.put('/:id', protect, sellerOnly, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);

module.exports = router;