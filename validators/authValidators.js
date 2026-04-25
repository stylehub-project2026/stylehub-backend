const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const passwordRules = (field) =>
  body(field)
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('At least 8 characters')
    .matches(/[A-Z]/).withMessage('Needs an uppercase letter')
    .matches(/[0-9]/).withMessage('Needs a number');

const customerSignUpValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ min: 2, max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ min: 2, max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  passwordRules('password'),
  validate,
];

const sellerSignUpValidation = [
  body('brandName').trim().notEmpty().withMessage('Brand name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  passwordRules('password'),
  body('category').optional().isIn(['women', 'men', 'kids', 'all']).withMessage('Invalid category'),
  validate,
];

const signInValidation = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  validate,
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  passwordRules('newPassword'),
  validate,
];

module.exports = {
  customerSignUpValidation,
  sellerSignUpValidation,
  signInValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
