import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      message: "A valid bearer token is required"
    });
  }

  try {
    jwt.verify(match[1], process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};