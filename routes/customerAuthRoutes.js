const express = require('express');
const router = express.Router();

const { signUp, signIn, forgotPassword, resetPassword, getMe, updateProfile } = require('../controllers/customerAuthController');
const { protect, customerOnly } = require('../middleware/authMiddleware');
const {
  customerSignUpValidation,
  signInValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../validators/authValidators');

router.post('/signup', customerSignUpValidation, signUp);
router.post('/signin', signInValidation, signIn);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/me', protect, customerOnly, getMe);
router.put('/me', protect, customerOnly, updateProfile);

module.exports = router;