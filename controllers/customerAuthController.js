const Customer = require('../models/Customer');
const { generateToken, generateResetToken, verifyToken } = require('../utils/jwtUtils');
const { sendResetPasswordEmail } = require('../utils/emailUtils');

const signUp = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const customer = await Customer.create({ firstName, lastName, email, password });
    const token = generateToken(customer._id, 'customer');

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          role: 'customer'
        },
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

    const customer = await Customer.findOne({ email }).select('+password -resetToken -resetTokenExpiry');
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const ok = await customer.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(customer._id, 'customer');

    res.json({
      success: true,
      data: {
        user: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          role: 'customer'
        },
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

    const customer = await Customer.findOne({ email });
    if (!customer) return res.json(genericMsg);

    const resetToken = generateResetToken(customer._id, 'customer');
    customer.resetToken = resetToken;
    customer.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await customer.save({ validateBeforeSave: false });

    await sendResetPasswordEmail({
      to: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      resetToken,
      role: 'customer'
    });

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

    if (decoded.purpose !== 'password_reset' || decoded.role !== 'customer') {
      return res.status(400).json({ success: false, message: 'Invalid token.' });
    }

    const customer = await Customer.findById(decoded.id).select('+resetToken +resetTokenExpiry');
    if (!customer || customer.resetToken !== token) {
      return res.status(400).json({ success: false, message: 'Token already used or invalid.' });
    }

    if (!customer.resetTokenExpiry || new Date() > customer.resetTokenExpiry) {
      return res.status(400).json({ success: false, message: 'Token expired.' });
    }

    customer.password = newPassword;
    customer.resetToken = null;
    customer.resetTokenExpiry = null;
    await customer.save();

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
    const { firstName, lastName, phone } = req.body;
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;

    const customer = await Customer.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -resetToken -resetTokenExpiry');

    res.json({ success: true, data: { user: customer } });
  } catch (err) {
    next(err);
  }
};

module.exports = { signUp, signIn, forgotPassword, resetPassword, getMe, updateProfile };