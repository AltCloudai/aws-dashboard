
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { timingSafeEqual } from "node:crypto";

import s3Routes from "./routes/s3.routes.js";
import ec2Routes from "./routes/ec2.routes.js";

import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/notFound.middleware.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "127.0.0.1";
const apiToken = process.env.CLOUDCONTROL_API_TOKEN;

if (!apiToken || Buffer.byteLength(apiToken, "utf8") < 32) {
  throw new Error("CLOUDCONTROL_API_TOKEN must be configured with at least 32 bytes");
}

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGINS must contain at least one allowed origin");
}

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.includes(origin));
  }
}));

app.use(express.json());

app.use("/api", (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const providedToken = match ? Buffer.from(match[1], "utf8") : Buffer.alloc(0);
  const expectedToken = Buffer.from(apiToken, "utf8");

  if (
    providedToken.length !== expectedToken.length ||
    !timingSafeEqual(providedToken, expectedToken)
  ) {
    res.set("WWW-Authenticate", 'Bearer realm="CloudControl API"');
    return res.status(401).json({
      success: false,
      message: "A valid bearer token is required"
    });
  }

  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CloudControl backend is running!"
  });
});
app.use("/api/s3", s3Routes);
app.use("/api/ec2", ec2Routes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);

app.listen(PORT, HOST, () => {
  console.log(`CloudControl backend running at http://${HOST}:${PORT}`);
  console.log(`Region: ${process.env.AWS_REGION}`);
});
