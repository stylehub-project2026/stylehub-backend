const Product = require('../models/Product');

const getProducts = async (req, res, next) => {
  try {
    const { category, tag, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter)
      .populate('seller', 'brandName logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({ success: true, data: { products, total, page: Number(page) } });
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'brandName logo description');
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, salePrice, category, tags, sizes, colors, stock } = req.body;

    const product = await Product.create({
      seller: req.user._id,
      name, description, price, salePrice, category, tags, sizes, colors, stock,
    });

    res.status(201).json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    product.isActive = false;
    await product.save();

    res.json({ success: true, message: 'Product removed.' });
  } catch (err) {
    next(err);
  }
};

const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { products } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getMyProducts };
