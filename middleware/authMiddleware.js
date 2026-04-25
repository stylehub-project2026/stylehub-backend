const { verifyToken } = require('../utils/jwtUtils');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (decoded.role === 'customer') {
      req.user = await Customer.findById(decoded.id).select('-password -resetToken -resetTokenExpiry');
    } else if (decoded.role === 'seller') {
      req.user = await Seller.findById(decoded.id).select('-password -resetToken -resetTokenExpiry');
    }
    if (!req.user) return res.status(401).json({ success: false, message: 'User no longer exists' });
    req.user.role = decoded.role;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const customerOnly = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return res.status(403).json({ success: false, message: 'Customers only' });
  }
  next();
};

const sellerOnly = (req, res, next) => {
  if (req.user?.role !== 'seller') {
    return res.status(403).json({ success: false, message: 'Sellers only' });
  }
  next();
};

module.exports = { protect, customerOnly, sellerOnly };