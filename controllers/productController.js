const Product = require('../models/Product');
const Seller = require('../models/Seller'); // ✅ مهم عشان populate يشتغل
const path = require('path');

const getProducts = async (req, res, next) => {
  try {
    const { category, tag, minPrice, maxPrice, search, brand, sellerId, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category.toLowerCase(); // ✅ lowercase دايما
    if (tag) filter.tags = tag;
    if (sellerId) filter.seller = sellerId;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.name = { $regex: search, $options: 'i' };

    if (brand) {
      const seller = await Seller.findOne({ brandName: { $regex: `^${brand}$`, $options: 'i' } });
      if (seller) {
        filter.seller = seller._id;
      } else {
        return res.json({ success: true, data: { products: [], total: 0, page: Number(page) } });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter)
      .populate('seller', 'brandName logo description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);
    res.json({ success: true, data: { products, total, page: Number(page) } });
  } catch (err) {
    console.error('getProducts error:', err.message);
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
  } catch (err) { next(err); }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, salePrice, category, tags, sizes, colors, stock } = req.body;

    const images = req.files && req.files.length > 0
      ? req.files.map(f => f.path)
      : [];

    const parsedSizes = Array.isArray(sizes) ? sizes : sizes ? sizes.split(',').map(s => s.trim()).filter(Boolean) : [];
    const parsedColors = Array.isArray(colors) ? colors : colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [];

    const product = await Product.create({
      seller: req.user._id,
      name,
      description,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : undefined,
      category: category?.toLowerCase() || 'all', // ✅ lowercase دايما
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      sizes: parsedSizes,
      colors: parsedColors,
      stock: Number(stock) || 0,
      images,
    });

    res.status(201).json({ success: true, data: { product } });
  } catch (err) { next(err); }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { name, description, price, salePrice, category, tags, sizes, colors, stock } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (salePrice !== undefined) product.salePrice = salePrice ? Number(salePrice) : undefined;
    if (category !== undefined) product.category = category.toLowerCase(); // ✅
    if (stock !== undefined) product.stock = Number(stock);
    if (tags !== undefined) product.tags = Array.isArray(tags) ? tags : [tags];

    if (sizes !== undefined) {
      product.sizes = Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (colors !== undefined) {
      product.colors = Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim()).filter(Boolean);
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.path);
      product.images = [...product.images, ...newImages];
    }

    await product.save();
    res.json({ success: true, data: { product } });
  } catch (err) { next(err); }
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
  } catch (err) { next(err); }
};

const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ seller: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: { products } });
  } catch (err) { next(err); }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getMyProducts };