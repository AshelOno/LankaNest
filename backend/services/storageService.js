const path = require("path");
const { Upload } = require("@aws-sdk/lib-storage");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/awsS3");

function safeSegment(value) {
  return String(value || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function objectKey(prefix, originalName) {
  const ext = path.extname(originalName || "").toLowerCase();
  const base = safeSegment(path.basename(originalName || "upload", ext));
  const id = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${safeSegment(prefix)}/${id}-${base}${ext}`;
}

async function uploadBuffer({ bucket, prefix, file, visibility = "private" }) {
  if (!bucket) {
    throw new Error("Storage bucket is not configured");
  }

  if (!file?.buffer) {
    throw new Error("Upload file buffer is missing");
  }

  const key = objectKey(prefix, file.originalname);
  const params = {
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: safeSegment(file.originalname),
    },
  };

  // NOTE: ACL is intentionally NOT set here.
  // S3 buckets with "Bucket owner enforced" object ownership (the modern
  // default) reject any request that includes an ACL parameter.
  // Public read access should be configured via an S3 Bucket Policy instead.

  const upload = new Upload({ client: s3, params });
  const result = await upload.done();

  // Build the public URL ourselves so it works regardless of whether
  // the SDK populates result.Location (some regions / endpoints don't).
  const region = process.env.AWS_REGION || "ap-south-1";
  const publicUrl =
    visibility === "public"
      ? `https://${bucket}.s3.${region}.amazonaws.com/${key}`
      : undefined;

  return {
    bucket,
    key,
    url: publicUrl || result.Location,
    contentType: file.mimetype,
    originalName: file.originalname,
    size: file.size,
  };
}

function uploadListingImage(file) {
  return uploadBuffer({
    bucket: process.env.AWS_LISTING_BUCKET_NAME || process.env.AWS_BUCKET_NAME,
    prefix: "listings",
    file,
    visibility: process.env.AWS_PUBLIC_LISTING_IMAGES === "false" ? "private" : "public",
  });
}

function uploadProfileImage(file, userId) {
  return uploadBuffer({
    bucket: process.env.AWS_PROFILE_BUCKET_NAME || process.env.AWS_LISTING_BUCKET_NAME || process.env.AWS_BUCKET_NAME,
    prefix: `profiles/${userId || "user"}`,
    file,
    visibility: "public",
  });
}

function uploadPrivateDocument(file, prefix) {
  return uploadBuffer({
    bucket: process.env.AWS_NIC_BUCKET_NAME,
    prefix,
    file,
    visibility: "private",
  });
}

function uploadPaymentProof(file) {
  return uploadBuffer({
    bucket: process.env.AWS_PAYMENT_PROOF_BUCKET_NAME || process.env.AWS_NIC_BUCKET_NAME,
    prefix: "payment-proofs",
    file,
    visibility: "private",
  });
}

async function signedDocumentUrl(bucket, key, expiresIn = 300) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

module.exports = {
  signedDocumentUrl,
  uploadListingImage,
  uploadProfileImage,
  uploadPaymentProof,
  uploadPrivateDocument,
};
