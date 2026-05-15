const REQUIRED_IN_PRODUCTION = [
  "FRONTEND_URL",
  "JWT_SECRET",
  "MONGO_URI",
  "REDIS_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_LISTING_BUCKET_NAME",
  "AWS_NIC_BUCKET_NAME",
  "AWS_PAYMENT_PROOF_BUCKET_NAME",
  "PAYHERE_MERCHANT_ID",
  "PAYHERE_MERCHANT_SECRET",
  "EMAIL_HOST",
  "EMAIL_USER",
  "EMAIL_PASS",
];

function getEnv(name, fallback = undefined) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function getAllowedOrigins() {
  return [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    process.env.ADMIN_FRONTEND_URL,
  ]
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ""));
}

function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`
    );
  }

  if ((process.env.JWT_SECRET || "").length < 48) {
    throw new Error("JWT_SECRET must be at least 48 characters in production");
  }
}

module.exports = {
  getAllowedOrigins,
  getEnv,
  validateEnv,
};
