
const errorMiddleware = (err, req, res, next) => {
  console.error("Application Error:", err);

  const statusCode = err.statusCode || err.$metadata?.httpStatusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "An internal server error occurred"
  });
};

export default errorMiddleware;
