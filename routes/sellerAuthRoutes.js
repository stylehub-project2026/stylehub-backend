const express = require('express');
const router = express.Router();

const { signUp, signIn, forgotPassword, resetPassword, getMe, updateProfile } = require('../controllers/sellerAuthController');
const { protect, sellerOnly } = require('../middleware/authMiddleware');
const {
  sellerSignUpValidation,
  signInValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../validators/authValidators');

router.post('/signup', sellerSignUpValidation, signUp);
router.post('/signin', signInValidation, signIn);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/me', protect, sellerOnly, getMe);
router.put('/me', protect, sellerOnly, updateProfile);

module.exports = router;