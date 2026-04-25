const Customer = require('../models/Customer');

const getWishlist = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id).populate('wishlist', 'name price salePrice images category seller');
    res.json({ success: true, data: { wishlist: customer.wishlist } });
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const customer = await Customer.findById(req.user._id);

    if (customer.wishlist.includes(productId)) {
      return res.status(400).json({ success: false, message: 'Already in wishlist.' });
    }

    customer.wishlist.push(productId);
    await customer.save();

    res.json({ success: true, message: 'Added to wishlist.' });
  } catch (err) {
    next(err);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user._id);
    customer.wishlist = customer.wishlist.filter(id => id.toString() !== req.params.productId);
    await customer.save();

    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
