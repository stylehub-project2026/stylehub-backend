const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const updateProductRating = async (productId) => {
    const results = await Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        {
            $group: {
                _id: null,
                avg: { $avg: '$rating' },
                count: { $sum: 1 }
            }
        }
    ]);
    const avg = results[0]?.avg || 0;
    const count = results[0]?.count || 0;
    await Product.findByIdAndUpdate(productId, {
        avgRating: Number(avg.toFixed(1)),
        reviewCount: count
    });
};

const addReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
        const existing = await Review.findOne({ product: req.params.productId, customer: req.user._id });
        if (existing) return res.status(400).json({ success: false, message: 'Already reviewed.' });
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const review = await Review.create([{ product: req.params.productId, customer: req.user._id, rating, comment }], { session });
            await updateProductRating(req.params.productId);
        });
        await session.endSession();

        // ── Give 10 points for reviewing ──
        await Customer.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });
        const populatedReview = await Review.findOne({ product: req.params.productId, customer: req.user._id }).populate('customer', 'firstName lastName');
        res.status(201).json({ success: true, data: { review: populatedReview } });
    } catch (err) { next(err); }
};

const getProductReviews = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const product = await Product.findById(req.params.productId);
        const productAvgRating = product ? product.avgRating : 0;
        const productReviewCount = product ? product.reviewCount : 0;
        const reviews = await Review.find({ product: req.params.productId })
            .populate('customer', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        res.json({ success: true, data: { reviews, avgRating: productAvgRating, total: productReviewCount, page, limit, pages: Math.ceil(productReviewCount / limit) } });
    } catch (err) { next(err); }
};

const updateReview = async (req, res, next) => {
    try {
        const review = await Review.findOne({ _id: req.params.reviewId, customer: req.user._id });
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            await Review.findByIdAndUpdate(review._id, req.body, { session, new: true });
            await updateProductRating(review.product);
        });
        await session.endSession();
        const populatedReview = await Review.findById(req.params.reviewId).populate('customer', 'firstName lastName');
        res.json({ success: true, data: { review: populatedReview } });
    } catch (err) { next(err); }
};

const deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findOne({ _id: req.params.reviewId, customer: req.user._id });
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            await Review.findByIdAndDelete(review._id, { session });
            await updateProductRating(review.product);
        });
        await session.endSession();
        res.json({ success: true, message: 'Review deleted.' });
    } catch (err) { next(err); }
};

// ── POINTS: get customer points ──
const getMyPoints = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.user._id).select('points');
        res.json({ success: true, data: { points: customer.points || 0 } });
    } catch (err) { next(err); }
};

// ── POINTS: redeem points for discount (100 pts = LE 10) ──
const redeemPoints = async (req, res, next) => {
    try {
        const { pointsToRedeem } = req.body;
        const customer = await Customer.findById(req.user._id).select('points');
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
        if (pointsToRedeem > customer.points) return res.status(400).json({ success: false, message: 'Not enough points.' });
        const discount = Math.floor(pointsToRedeem / 100) * 10;
        await Customer.findByIdAndUpdate(req.user._id, { $inc: { points: -pointsToRedeem } });
        res.json({ success: true, data: { discount, remainingPoints: customer.points - pointsToRedeem } });
    } catch (err) { next(err); }
};

module.exports = { addReview, getProductReviews, updateReview, deleteReview, getMyPoints, redeemPoints };