const express = require('express');
const router = express.Router();
const { getAddresses, addAddress, updateAddress, deleteAddress } = require('../controllers/addressController');
const { protect, customerOnly } = require('../middleware/authMiddleware');

router.use(protect, customerOnly);
router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;