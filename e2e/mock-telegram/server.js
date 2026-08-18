// ============================================================
// Mock Telegram Bot API — used ONLY by the E2E suite.
//
// The backend is pointed at this service via TELEGRAM_API_BASE
// (see docker-compose.yml). It implements the endpoints the CMS
// uses (getMe / getChat / sendPhoto / getUpdates), records every
// sendPhoto payload, and exposes them on /_sends so Playwright
// can assert on the caption + inline buttons.
//
//   Valid token : 123456789:TEST_BOT_TOKEN_1234567890
//   Invalid     : 123456789:INVALID_TOKEN_TEST_123456789  (401)
//   Valid chats :
//     -1001234567890   channel    "Test News Channel"
//     -1009876543210   supergroup "Test Super Group"
//     -567890123       group      "Test Group"
//     1234567890       private    "Test Personal User"
// ============================================================

const http = require("http");

const VALID_TOKEN = "123456789:TEST_BOT_TOKEN_1234567890";
const INVALID_TOKEN = "123456789:INVALID_TOKEN_TEST_123456789";

const CHATS = {
  "-1001234567890": { id: -1001234567890, title: "Test News Channel", type: "channel", username: "navatra_test" },
  "-1009876543210": { id: -1009876543210, title: "Test Super Group", type: "supergroup", username: "navatra_super" },
  "-567890123": { id: -567890123, title: "Test Group", type: "group", username: "navatra_group" },
  "1234567890": { id: 1234567890, title: "Test Personal User", type: "private", first_name: "Test", last_name: "User" },
};

const state = { messageId: 1000, sends: [] };

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(payload);
}

/** Minimal multipart/form-data parser (text fields + one file part). */
function parseMultipart(body, boundary) {
  const parts = [];
  const delim = Buffer.from("--" + boundary);
  let pos = 0;
  for (;;) {
    const start = body.indexOf(delim, pos);
    if (start === -1) break;
    const after = start + delim.length;
    if (body.slice(after, after + 2).toString() === "--") break; // closing boundary
    if (body.slice(after, after + 2).toString() !== "\r\n") {
      pos = after;
      continue;
    }
    const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), after + 2);
    if (headerEnd === -1) break;
    const contentStart = headerEnd + 4;
    const partEnd = body.indexOf(Buffer.from("\r\n--" + boundary), contentStart);
    if (partEnd === -1) break;
    const headerText = body.slice(after + 2, headerEnd).toString();
    const cd = (headerText.match(/^content-disposition: (.+)$/im) || [])[1] || "";
    parts.push({
      name: (cd.match(/name="([^"]*)"/) || [])[1],
      filename: (cd.match(/filename="([^"]*)"/) || [])[1],
      type: (headerText.match(/^content-type: (.+)$/im) || [])[1],
      content: body.slice(contentStart, partEnd),
    });
    pos = partEnd + 2;
  }
  return parts;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  // Test-inspection endpoints (host-reachable via the published port).
  if (url.pathname === "/_sends") {
    return json(res, 200, { count: state.sends.length, sends: state.sends });
  }
  if (url.pathname === "/_reset") {
    state.messageId = 1000;
    state.sends = [];
    return json(res, 200, { ok: true });
  }

  const m = url.pathname.match(/^\/bot([^/]+)\/(getMe|getChat|sendPhoto|getUpdates)$/);
  if (!m) return json(res, 404, { ok: false, error_code: 404, description: "Not Found" });

  const token = decodeURIComponent(m[1]);
  const method = m[2];

  if (method === "getMe") {
    if (token !== VALID_TOKEN) {
      return json(res, 401, { ok: false, error_code: 401, description: "Unauthorized" });
    }
    return json(res, 200, {
      ok: true,
      result: { id: 123456789, is_bot: true, first_name: "Navatra Test Bot", username: "navatra_test_bot" },
    });
  }

  if (method === "getChat") {
    if (token !== VALID_TOKEN) {
      return json(res, 401, { ok: false, error_code: 401, description: "Unauthorized" });
    }
    const raw = url.searchParams.get("chat_id") || "";
    const chatId = raw.replace("@", "");
    const chat = Object.values(CHATS).find((c) => String(c.id) === chatId || c.username === chatId);
    if (!chat) {
      return json(res, 400, { ok: false, error_code: 400, description: "Bad Request: chat not found" });
    }
    return json(res, 200, {
      ok: true,
      result: { id: chat.id, title: chat.title, type: chat.type, username: chat.username },
    });
  }

  if (method === "getUpdates") {
    if (token !== VALID_TOKEN) {
      return json(res, 401, { ok: false, error_code: 401, description: "Unauthorized" });
    }
    // Simulate a user pressing /start + the bot being added to a group.
    const updates = [
      { update_id: 1, message: { message_id: 10, chat: CHATS["1234567890"], text: "/start" } },
      { update_id: 2, my_chat_member: { chat: CHATS["-567890123"] } },
      { update_id: 3, channel_post: { message_id: 11, chat: CHATS["-1001234567890"], text: "post" } },
      { update_id: 4, my_chat_member: { chat: CHATS["-1009876543210"] } },
    ];
    return json(res, 200, { ok: true, result: updates });
  }

  // sendPhoto
  if (token !== VALID_TOKEN) {
    return json(res, 401, { ok: false, error_code: 401, description: "Unauthorized" });
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const boundary = (req.headers["content-type"] || "").match(/boundary=(.+)$/)?.[1];
    const parts = boundary ? parseMultipart(body, boundary) : [];
    const field = (name) => (parts.find((p) => p.name === name) || {}).content?.toString() ?? "";
    const photo = parts.find((p) => p.name === "photo");
    const replyMarkupRaw = field("reply_markup");

    const record = {
      chat_id: field("chat_id"),
      caption: field("caption"),
      parse_mode: field("parse_mode"),
      reply_markup: replyMarkupRaw ? JSON.parse(replyMarkupRaw) : null,
      photo: photo
        ? { filename: photo.filename || null, mimeType: photo.type || null, size: photo.content.length }
        : null,
    };
    const rawChat = record.chat_id.replace("@", "");
    const chat = Object.values(CHATS).find((c) => String(c.id) === rawChat || c.username === rawChat);
    if (!chat) {
      return json(res, 400, { ok: false, error_code: 400, description: "Bad Request: chat not found" });
    }
    state.messageId += 1;
    record.message_id = state.messageId;
    state.sends.push(record);
    return json(res, 200, {
      ok: true,
      result: { message_id: record.message_id, chat: { id: chat.id } },
    });
  });
  return;
});

server.listen(8448, () => {
  console.log("[mock-telegram] listening on :8448");
});
