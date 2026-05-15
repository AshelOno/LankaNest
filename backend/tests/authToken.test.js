const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  getBearerToken,
  pickCookieToken,
  selectRequestToken,
  selectSocketToken,
} = require("../utils/authToken");

test("getBearerToken ignores empty bearer values", () => {
  assert.equal(getBearerToken("Bearer null"), null);
  assert.equal(getBearerToken("Bearer undefined"), null);
  assert.equal(getBearerToken("Bearer token-123"), "token-123");
});

test("pickCookieToken honors explicit role hints on shared routes", () => {
  const cookies = {
    token: "student-cookie",
    landlordToken: "landlord-cookie",
    adminToken: "admin-cookie",
  };

  assert.equal(pickCookieToken(cookies, "student", "/api/chat/conversations"), "student-cookie");
  assert.equal(pickCookieToken(cookies, "landlord", "/api/chat/conversations"), "landlord-cookie");
  assert.equal(pickCookieToken(cookies, "admin", "/api/chat/conversations"), "admin-cookie");
});

test("selectRequestToken prefers authorization headers over role hints", () => {
  const req = {
    headers: { authorization: "Bearer header-token", "x-auth-role": "landlord" },
    cookies: { landlordToken: "landlord-cookie" },
    originalUrl: "/api/chat/conversations",
  };

  assert.equal(selectRequestToken(req), "header-token");
});

test("selectSocketToken reads role hint from socket auth payload", () => {
  const handshake = {
    auth: { role: "landlord" },
    headers: {
      cookie: "token=student-cookie; landlordToken=landlord-cookie",
    },
  };

  assert.equal(selectSocketToken(handshake), "landlord-cookie");
});
