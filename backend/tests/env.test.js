const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { getAllowedOrigins, validateEnv } = require("../config/env");

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

test("getAllowedOrigins normalizes configured origins", () => {
  process.env.FRONTEND_URL = "https://lankanest.lk/";
  process.env.CORS_ORIGIN = "https://admin.lankanest.lk";
  process.env.ADMIN_FRONTEND_URL = "";

  assert.deepEqual(getAllowedOrigins(), [
    "https://lankanest.lk",
    "https://admin.lankanest.lk",
  ]);
});

test("validateEnv requires production secrets", () => {
  process.env = { NODE_ENV: "production" };

  assert.throws(
    () => validateEnv(),
    /Missing required production environment variables/
  );
});

test("validateEnv enforces a strong JWT secret in production", () => {
  process.env = {
    NODE_ENV: "production",
    FRONTEND_URL: "https://lankanest.lk",
    JWT_SECRET: "short",
    MONGO_URI: "mongodb://example",
    REDIS_URL: "redis://example",
    AWS_ACCESS_KEY_ID: "key",
    AWS_SECRET_ACCESS_KEY: "secret",
    AWS_REGION: "ap-south-1",
    AWS_LISTING_BUCKET_NAME: "listings",
    AWS_NIC_BUCKET_NAME: "nic",
    AWS_PAYMENT_PROOF_BUCKET_NAME: "proofs",
    PAYHERE_MERCHANT_ID: "merchant",
    PAYHERE_MERCHANT_SECRET: "payhere-secret",
    EMAIL_HOST: "smtp.example.com",
    EMAIL_USER: "mail@example.com",
    EMAIL_PASS: "mail-password",
  };

  assert.throws(
    () => validateEnv(),
    /JWT_SECRET must be at least 48 characters/
  );
});
