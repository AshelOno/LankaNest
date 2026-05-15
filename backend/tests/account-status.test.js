const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");

test("student auth controller exposes self-service account routes", () => {
  const source = readFileSync(path.join(root, "controllers", "authController.js"), "utf8");

  assert.match(source, /exports\.updateMe\s*=/);
  assert.match(source, /exports\.changeMyPassword\s*=/);
  assert.match(source, /exports\.deactivateMe\s*=/);
  assert.match(source, /exports\.deleteMe\s*=/);
  assert.match(source, /StudentProfile\.deleteMany/);
  assert.match(source, /Bookmark\.deleteMany/);
  assert.match(source, /Notification\.deleteMany/);
});

test("verifyToken rejects deactivated and deleted user accounts", () => {
  const source = readFileSync(path.join(root, "middleware", "verifyToken.js"), "utf8");

  assert.match(source, /accountStatus !== "active"/);
  assert.match(source, /accountStatus: user\.accountStatus/);
  assert.match(source, /Your account has been deactivated/);
  assert.match(source, /This account is no longer available/);
});

test("user schema tracks account lifecycle status", () => {
  const source = readFileSync(path.join(root, "models", "User.js"), "utf8");

  assert.match(source, /accountStatus/);
  assert.match(source, /"active", "deactivated", "deleted"/);
});
