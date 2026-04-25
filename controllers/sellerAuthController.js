const Seller = require('../models/Seller');
const { generateToken, generateResetToken, verifyToken } = require('../utils/jwtUtils');
const { sendResetPasswordEmail } = require('../utils/emailUtils');

const signUp = async (req, res, next) => {
  try {
    const { brandName, email, password, phone, description, category } = req.body;

    const existing = await Seller.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const seller = await Seller.create({ brandName, email, password, phone, description, category });
    const token = generateToken(seller._id, 'seller');

    res.status(201).json({
      success: true,
      data: {
        user: { id: seller._id, brandName: seller.brandName, email: seller.email, role: 'seller', isApproved: seller.isApproved },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const seller = await Seller.findOne({ email }).select('+password -resetToken -resetTokenExpiry');
    if (!seller) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const ok = await seller.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(seller._id, 'seller');

    res.json({
      success: true,
      data: {
        user: { id: seller._id, brandName: seller.brandName, email: seller.email, role: 'seller', isApproved: seller.isApproved },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericMsg = { success: true, message: 'If this email exists, a reset link was sent.' };

    const seller = await Seller.findOne({ email });
    if (!seller) return res.json(genericMsg);

    const resetToken = generateResetToken(seller._id, 'seller');
    seller.resetToken = resetToken;
    seller.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await seller.save({ validateBeforeSave: false });

    await sendResetPasswordEmail({ to: seller.email, name: seller.brandName, resetToken, role: 'seller' });

    res.json(genericMsg);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
    }

    if (decoded.purpose !== 'password_reset' || decoded.role !== 'seller') {
      return res.status(400).json({ success: false, message: 'Invalid token.' });
    }

    const seller = await Seller.findById(decoded.id).select('+resetToken +resetTokenExpiry');
    if (!seller || seller.resetToken !== token) {
      return res.status(400).json({ success: false, message: 'Token already used or invalid.' });
    }

    if (!seller.resetTokenExpiry || new Date() > seller.resetTokenExpiry) {
      return res.status(400).json({ success: false, message: 'Token expired.' });
    }

    seller.password = newPassword;
    seller.resetToken = null;
    seller.resetTokenExpiry = null;
    await seller.save();

    res.json({ success: true, message: 'Password updated. You can sign in now.' });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { brandName, phone, description, category } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      req.user._id,
      { brandName, phone, description, category },
      { new: true, runValidators: true }
    ).select('-password -resetToken -resetTokenExpiry');

    res.json({ success: true, data: { user: seller } });
  } catch (err) {
    next(err);
  }
};

module.exports = { signUp, signIn, forgotPassword, resetPassword, getMe, updateProfile };