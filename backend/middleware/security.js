const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 600);
const buckets = new Map();

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }

  next();
}

function rateLimiter(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const bucket = buckets.get(key) || { count: 0, resetAt: now + WINDOW_MS };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + WINDOW_MS;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader("RateLimit-Limit", String(MAX_REQUESTS));
  res.setHeader("RateLimit-Remaining", String(Math.max(MAX_REQUESTS - bucket.count, 0)));
  res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again shortly.",
    });
  }

  next();
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const safeMessage =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : err.message || "Something went wrong. Please try again.";

  if (process.env.NODE_ENV !== "test") {
    console.error("Unhandled request error:", {
      method: req.method,
      path: req.originalUrl,
      status,
      message: err.message,
    });
  }

  res.status(status).json({
    success: false,
    message: safeMessage,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
  rateLimiter,
  securityHeaders,
};
