
import { Router } from "express";
import multer from "multer";

import {
  listBuckets,
  createBucket,
  listObjects,
  uploadObject,
  downloadObject,
  deleteObject,
  deleteBucket
} from "../controllers/s3.controller.js";

import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 10
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  }
});

// Bucket operations
router.get("/buckets", asyncHandler(listBuckets));
router.post("/buckets", asyncHandler(createBucket));
router.delete("/buckets/:bucketName", asyncHandler(deleteBucket));

// Object operations
router.get(
  "/buckets/:bucketName/objects",
  asyncHandler(listObjects)
);

router.post(
  "/buckets/:bucketName/objects",
  upload.single("file"),
  asyncHandler(uploadObject)
);

router.get(
  "/buckets/:bucketName/objects/:key/download",
  asyncHandler(downloadObject)
);

router.delete(
  "/buckets/:bucketName/objects/:key",
  asyncHandler(deleteObject)
);

export default router;
