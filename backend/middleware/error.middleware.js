
const errorMiddleware = (err, req, res, next) => {
  console.error("Application Error:", err);

  const statusCode = err.statusCode || err.status || err.$metadata?.httpStatusCode || 500;
  const isAwsError = Boolean(err.$metadata);

  res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500 || isAwsError
        ? "An internal server error occurred"
        : err.message || "Request failed"
  });
};

export default errorMiddleware;
