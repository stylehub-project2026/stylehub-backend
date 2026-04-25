const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ customer: req.user._id })
            .populate('items.product', 'name price salePrice images stock isActive');
        if (!cart) return res.json({ success: true, data: { items: [], total: 0 } });
        const items = cart.items.filter(i => i.product && i.product.isActive);
        const total = items.reduce((sum, i) => {
            const price = i.product.salePrice || i.product.price;
            return sum + price * i.quantity;
        }, 0);
        res.json({ success: true, data: { items, total } });
    } catch (err) { next(err); }
};

const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1, size, color } = req.body;
        const product = await Product.findById(productId);
        if (!product || !product.isActive)
            return res.status(404).json({ success: false, message: 'Product not found.' });
        let cart = await Cart.findOne({ customer: req.user._id });
        if (!cart) cart = await Cart.create({ customer: req.user._id, items: [] });
        const existing = cart.items.find(i => i.product.toString() === productId && i.size === size && i.color === color);
        if (existing) { existing.quantity += quantity; } else { cart.items.push({ product: productId, quantity, size, color }); }
        await cart.save();
        res.json({ success: true, message: 'Added to cart.' });
    } catch (err) { next(err); }
};

const updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ customer: req.user._id });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
        const item = cart.items.id(req.params.itemId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
        if (quantity <= 0) { item.deleteOne(); } else { item.quantity = quantity; }
        await cart.save();
        res.json({ success: true, message: 'Cart updated.' });
    } catch (err) { next(err); }
};

const removeFromCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ customer: req.user._id });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
        cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId);
        await cart.save();
        res.json({ success: true, message: 'Item removed.' });
    } catch (err) { next(err); }
};

const clearCart = async (req, res, next) => {
    try {
        await Cart.findOneAndUpdate({ customer: req.user._id }, { items: [] });
        res.json({ success: true, message: 'Cart cleared.' });
    } catch (err) { next(err); }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };