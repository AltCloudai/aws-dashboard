
import {
  ListBucketsCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteBucketCommand
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { s3 } from "../config/aws.js";

// 1. LIST BUCKETS
export const listBuckets = async (req, res) => {
  const data = await s3.send(
    new ListBucketsCommand({})
  );

  res.json({
    success: true,
    buckets: data.Buckets || []
  });
};


// 2. CREATE BUCKET
export const createBucket = async (req, res) => {
  const { bucketName } = req.body;

  if (!bucketName) {
    return res.status(400).json({
      success: false,
      message: "Bucket name is required"
    });
  }

  const region = process.env.AWS_REGION || "ap-southeast-2";

  const data = await s3.send(
    new CreateBucketCommand({
      Bucket: bucketName,
      ...(region !== "us-east-1" && {
        CreateBucketConfiguration: {
          LocationConstraint: region
        }
      })
    })
  );

  res.status(201).json({
    success: true,
    message: "Bucket created successfully",
    location: data.Location
  });
};


// 3. LIST OBJECTS
export const listObjects = async (req, res) => {
  const { bucketName } = req.params;
  const { continuationToken } = req.query;

  const data = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1000,
      ...(continuationToken && {
        ContinuationToken: continuationToken
      })
    })
  );

  res.json({
    success: true,
    objects: data.Contents || [],
    isTruncated: data.IsTruncated || false,
    nextContinuationToken: data.NextContinuationToken || null
  });
};


// 4. UPLOAD OBJECT
export const uploadObject = async (req, res) => {
  const { bucketName } = req.params;
  const { key } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "File is required"
    });
  }

  const objectKey = key || req.file.originalname;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    })
  );

  res.status(201).json({
    success: true,
    message: "File uploaded successfully",
    key: objectKey
  });
};


// 5. GENERATE DOWNLOAD URL
export const downloadObject = async (req, res) => {
  const { bucketName, key } = req.params;

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  const url = await getSignedUrl(s3, command, {
    expiresIn: 300
  });

  res.json({
    success: true,
    downloadUrl: url,
    expiresIn: 300
  });
};


// 6. DELETE OBJECT
export const deleteObject = async (req, res) => {
  const { bucketName, key } = req.params;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    })
  );

  res.json({
    success: true,
    message: "Object deleted successfully"
  });
};


// 7. DELETE BUCKET
export const deleteBucket = async (req, res) => {
  const { bucketName } = req.params;

  await s3.send(
    new DeleteBucketCommand({
      Bucket: bucketName
    })
  );

  res.json({
    success: true,
    message: "Bucket deleted successfully"
  });
};
