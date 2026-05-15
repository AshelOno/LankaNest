const assert = require("node:assert/strict");
const { test } = require("node:test");
const { requireSelfParam } = require("../middleware/authorize");

function mockResponse() {
  return {
    statusCode: undefined,
    body: undefined,
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

test("requireSelfParam allows matching authenticated users", () => {
  const req = {
    params: { userId: "user-1" },
    query: {},
    body: {},
    userId: "user-1",
  };
  const res = mockResponse();
  let nextCalled = false;

  requireSelfParam("userId")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, undefined);
});

test("requireSelfParam blocks cross-user access", () => {
  const req = {
    params: { userId: "user-2" },
    query: {},
    body: {},
    userId: "user-1",
  };
  const res = mockResponse();

  requireSelfParam("userId")(req, res, () => {});

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    success: false,
    message: "Access denied",
  });
});

test("requireSelfParam lets admins inspect user-scoped resources", () => {
  const req = {
    params: { userId: "user-2" },
    query: {},
    body: {},
    userId: "admin-1",
    authRole: "admin",
  };
  const res = mockResponse();
  let nextCalled = false;

  requireSelfParam("userId")(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});
