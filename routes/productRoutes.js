const express = require('express');
const router = express.Router();

const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getMyProducts } = require('../controllers/productController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/my', protect, sellerOnly, getMyProducts);  // must be before /:id
router.get('/:id', getProduct);
router.post('/', protect, sellerOnly, createProduct);
router.put('/:id', protect, sellerOnly, updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);

module.exports = router;
