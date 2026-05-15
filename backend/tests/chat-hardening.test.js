const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");

test("sendMessage does not require MongoDB transactions", () => {
  const source = readFileSync(
    path.join(root, "controllers", "chatController.js"),
    "utf8"
  );

  const sendMessageSource = source.slice(
    source.indexOf("exports.sendMessage"),
    source.indexOf("exports.createConversation")
  );

  assert.equal(sendMessageSource.includes("startSession"), false);
  assert.equal(sendMessageSource.includes("session.startTransaction"), false);
});

test("read and send flows invalidate stale chat caches", () => {
  const source = readFileSync(
    path.join(root, "controllers", "chatController.js"),
    "utf8"
  );

  assert.match(source, /invalidateMessageCache\(conversationId\)/);
  assert.match(source, /invalidateConversationsCache\(\s*conversation\.participants\.map/);
});

test("socket conversation room access is checked against participants", () => {
  const source = readFileSync(path.join(root, "config", "socket.js"), "utf8");

  assert.match(source, /Conversation\.exists/);
  assert.match(source, /participants:\s*userId/);
  assert.match(source, /Unauthorized conversation access/);
});
