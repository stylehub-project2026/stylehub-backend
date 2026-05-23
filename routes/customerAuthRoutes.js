const express = require('express');
const router = express.Router();

const {
  signUp, signIn, forgotPassword, resetPassword,
  getMe, updateProfile, changePassword, updateAddress
} = require('../controllers/customerAuthController');
const { protect, customerOnly } = require('../middleware/authMiddleware');
const {
  customerSignUpValidation,
  signInValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../validators/authValidators');

const { googleAuth } = require('../controllers/Googleauthcontroller');
require('../config/firebaseAdmin');

router.post('/google', googleAuth);

router.post('/signup', customerSignUpValidation, signUp);
router.post('/signin', signInValidation, signIn);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/me', protect, customerOnly, getMe);
router.put('/me', protect, customerOnly, updateProfile);

// ── NEW ──────────────────────────────────────────────────────────────────────
router.put('/change-password', protect, customerOnly, changePassword);
router.put('/update-address', protect, customerOnly, updateAddress);

const { getMyPoints, redeemPoints } = require('../controllers/reviewController');
router.get('/points', protect, customerOnly, getMyPoints);
router.post('/points/redeem', protect, customerOnly, redeemPoints);

module.exports = router;