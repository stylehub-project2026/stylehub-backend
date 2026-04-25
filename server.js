require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const rateLimiter = require('./middleware/rateLimiter');

const customerAuthRoutes = require('./routes/customerAuthRoutes');
const sellerAuthRoutes = require('./routes/sellerAuthRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const addressRoutes = require('./routes/addressRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

const app = express();

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Manual CORS — works reliably with Express 5
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/customer/auth', rateLimiter);
app.use('/api/seller/auth', rateLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/seller', sellerRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
