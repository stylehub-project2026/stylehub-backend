const jwt = require('jsonwebtoken');

// FIX: Removed insecure hardcoded fallback. The app will now throw clearly
// at startup if JWT_SECRET is missing, rather than silently using a known string.
const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateResetToken = (id, role) => {
  return jwt.sign({ id, role, purpose: 'password_reset' }, secret, {
    expiresIn: '1h',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, secret);
};

module.exports = { generateToken, generateResetToken, verifyToken };