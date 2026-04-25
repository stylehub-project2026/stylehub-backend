const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
