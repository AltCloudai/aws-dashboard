
import { S3Client } from "@aws-sdk/client-s3";
import { EC2Client } from "@aws-sdk/client-ec2";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "ap-southeast-2";

export const s3 = new S3Client({
  region
});

export const ec2 = new EC2Client({
  region
});
