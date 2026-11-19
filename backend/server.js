import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes.js";
import s3Routes from "./routes/s3.routes.js";
import ec2Routes from "./routes/ec2.routes.js";

import { authMiddleware } from "./middleware/auth.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import notFoundMiddleware from "./middleware/notFound.middleware.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "127.0.0.1";

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.includes(origin));
  }
}));

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CloudControl backend is running!"
  });
});

app.use("/api/s3", authMiddleware, s3Routes);
app.use("/api/ec2", authMiddleware, ec2Routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(PORT, HOST, () => {
  console.log(`CloudControl backend running at http://${HOST}:${PORT}`);
  console.log(`Region: ${process.env.AWS_REGION}`);
});