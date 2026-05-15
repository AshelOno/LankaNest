const assert = require("node:assert/strict");
const { test } = require("node:test");
const { errorHandler, notFoundHandler, securityHeaders } = require("../middleware/security");

function mockResponse() {
  const headers = {};
  return {
    headers,
    body: undefined,
    statusCode: undefined,
    headersSent: false,
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("securityHeaders applies production-safe browser headers", () => {
  const res = mockResponse();
  let nextCalled = false;

  securityHeaders({}, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(res.headers["X-Frame-Options"], "DENY");
  assert.equal(res.headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.match(res.headers["Permissions-Policy"], /camera=\(\)/);
});

test("notFoundHandler returns a stable JSON 404", () => {
  const res = mockResponse();

  notFoundHandler({}, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, {
    success: false,
    message: "Route not found",
  });
});

test("errorHandler hides internal errors in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousConsoleError = console.error;
  process.env.NODE_ENV = "production";
  console.error = () => {};
  const res = mockResponse();

  errorHandler(
    new Error("database password leaked in stack"),
    { method: "GET", originalUrl: "/api/example" },
    res,
    () => {}
  );

  process.env.NODE_ENV = previousNodeEnv;
  console.error = previousConsoleError;
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: "Something went wrong. Please try again.",
  });
});
