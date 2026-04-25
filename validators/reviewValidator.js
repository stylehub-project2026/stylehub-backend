const { body, query, validationResult } = require('express-validator');

const createReviewValidation = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be integer between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment max 500 chars').trim().escape(),
];

const updateReviewValidation = [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be integer between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment max 500 chars').trim().escape(),
];

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    next();
};

const validateCreateReview = [createReviewValidation, handleValidation];
const validateUpdateReview = [updateReviewValidation, handleValidation];

module.exports = { validateCreateReview, validateUpdateReview };

