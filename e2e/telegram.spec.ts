import { expect, test } from "@playwright/test";
import { PUBLIC_URL } from "../playwright.config";
import { api, getAdminToken, loginAsAdmin } from "./helpers";

/**
 * Telegram auto-publish E2E — runs against a stack started with
 * TELEGRAM_API_BASE=http://mock-telegram:8448 so the backend talks to the
 * in-repo mock (e2e/mock-telegram) instead of the real Bot API:
 *
 *   npm run test:e2e:telegram
 *
 * The mock records every sendPhoto; the test asserts on the caption, the
 * bilingual inline buttons, multi-destination publishing (channel +
 * supergroup + personal), chat discovery via getUpdates and the public-site
 * language routing.
 */

const MOCK_URL = process.env.E2E_MOCK_URL ?? "http://localhost:8448";
const VALID_TOKEN = "123456789:TEST_BOT_TOKEN_1234567890";
const INVALID_TOKEN = "123456789:INVALID_TOKEN_TEST_123456789";

const CHANNEL = "-1001234567890";
const SUPERGROUP = "-1009876543210";
const GROUP = "-567890123";
const PERSONAL = "1234567890";

// 1x1 transparent PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function maskSecret(secret: string, visible = 4): string {
  if (secret.length <= visible + 3) return "***";
  return `${secret.slice(0, 4)}${"*".repeat(Math.max(4, secret.length - visible - 4))}${secret.slice(-visible)}`;
}

interface MockSend {
  message_id: number;
  chat_id: string;
  caption: string;
  parse_mode: string;
  reply_markup: { inline_keyboard: { text: string; url: string }[][] } | null;
  photo: { filename: string | null; mimeType: string | null; size: number } | null;
}

async function mockSends(request: import("@playwright/test").APIRequestContext): Promise<MockSend[]> {
  const res = await request.get(`${MOCK_URL}/_sends`);
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { sends: MockSend[] };
  return data.sends;
}

async function resetMock(request: import("@playwright/test").APIRequestContext): Promise<void> {
  await request.get(`${MOCK_URL}/_reset`);
}

async function uploadTestImage(
  request: import("@playwright/test").APIRequestContext,
  token: string
): Promise<string> {
  const res = await request.post(`http://localhost:4000/api/v1/admin/media/upload`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      file: {
        name: "telegram-test.png",
        mimeType: "image/png",
        buffer: Buffer.from(PNG_BASE64, "base64"),
      },
      folder: "articles",
    },
  });
  expect(res.status()).toBe(201);
  const data = (await res.json()) as { data: { secureUrl: string; url: string } };
  return data.data.secureUrl || data.data.url;
}

test.describe("telegram publishing (mock API)", () => {
  // Requires the backend to point at the mock Telegram API — see
  // `npm run test:e2e:telegram`. Skipped in the regular `npm run test:e2e`.
  test.skip(!process.env.E2E_TELEGRAM, "mock Telegram stack not active — run npm run test:e2e:telegram");

  test.describe.serial("telegram workflow", () => {
    let token: string;
    let articleId: number;
    let articleSlug: string;

    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      token = (await getAdminToken(page)) ?? "";
      expect(token).toBeTruthy();
    });

    test("save & test with two destinations — verified and persisted (masked)", async ({ request }) => {
      const res = await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: {
          botToken: VALID_TOKEN,
          destinations: [
            { chatId: CHANNEL, type: "channel" },
            { chatId: SUPERGROUP, type: "supergroup" },
          ],
          siteUrl: PUBLIC_URL,
          enabled: false,
          languageMode: "both",
        },
      });
      expect(res.status).toBe(200);
      const data = res.data as {
        test: {
          success: boolean;
          message: string;
          bot: { username: string; name: string };
          chats: { chatId: string; title: string; type: string }[];
        };
        settings: {
          botTokenMasked: string;
          destinations: { chatId: string; type: string; label: string; enabled: boolean }[];
          siteUrl: string;
          connected: boolean;
          enabled: boolean;
        };
      };
      expect(data.test.success).toBe(true);
      expect(data.test.bot.username).toBe("@navatra_test_bot");
      expect(data.test.chats).toHaveLength(2);
      expect(data.test.chats!.map((c) => c.chatId)).toEqual([CHANNEL, SUPERGROUP]);
      expect(data.test.chats![0].title).toBe("Test News Channel");
      expect(data.settings.connected).toBe(true);
      expect(data.settings.botTokenMasked).toBe(maskSecret(VALID_TOKEN));
      expect(data.settings.botTokenMasked).not.toContain("TEST_BOT_TOKEN");
      expect(data.settings.destinations).toHaveLength(2);
      expect(data.settings.destinations[0].type).toBe("channel");
      expect(data.settings.destinations[0].label).toBe("Test News Channel");
      expect(data.settings.siteUrl).toBe(PUBLIC_URL);
    });

    test("discover chats — users who started the bot + groups/channels returned", async ({ request }) => {
      const res = await api(request, "/admin/settings/telegram/discover", token, {
        method: "POST",
        body: {},
      });
      expect(res.status).toBe(200);
      const chats = res.data as { chatId: string; type: string; title: string }[];
      expect(chats.length).toBeGreaterThanOrEqual(4);
      const personal = chats.find((c) => c.chatId === PERSONAL);
      expect(personal).toBeTruthy();
      expect(personal!.type).toBe("private");
      expect(chats.some((c) => c.chatId === CHANNEL && c.type === "channel")).toBe(true);
      expect(chats.some((c) => c.chatId === SUPERGROUP && c.type === "supergroup")).toBe(true);
      expect(chats.some((c) => c.chatId === GROUP && c.type === "group")).toBe(true);
    });

    test("invalid bot token — getMe fails and credentials are NOT saved", async ({ request }) => {
      const before = await api(request, "/admin/settings/telegram", token);
      const beforeMasked = (before.data as { botTokenMasked: string }).botTokenMasked;

      const res = await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: { botToken: INVALID_TOKEN, destinations: [{ chatId: CHANNEL }] },
      });
      expect(res.status).toBe(400);
      expect(String(res.message)).toContain("token");

      const after = await api(request, "/admin/settings/telegram", token);
      expect((after.data as { botTokenMasked: string }).botTokenMasked).toBe(beforeMasked);
    });

    test("valid token + invalid chat — getChat fails and credentials are NOT saved", async ({ request }) => {
      const before = await api(request, "/admin/settings/telegram", token);
      const beforeMasked = (before.data as { botTokenMasked: string }).botTokenMasked;

      const res = await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: { botToken: VALID_TOKEN, destinations: [{ chatId: "9999999999" }] },
      });
      expect(res.status).toBe(400);
      expect(String(res.message).toLowerCase()).toContain("chat");

      const after = await api(request, "/admin/settings/telegram", token);
      expect((after.data as { botTokenMasked: string }).botTokenMasked).toBe(beforeMasked);
    });

    test("site URL — button links use the configured public site URL", async ({ request }) => {
      // Save with a custom public domain — button links must use it.
      const siteUrl = "https://news.example.com";
      const res = await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: { siteUrl },
      });
      expect(res.status).toBe(200);
      expect((res.data as { settings: { siteUrl: string } }).settings.siteUrl).toBe(siteUrl);

      // A non-http URL is rejected.
      const bad = await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: { siteUrl: "javascript:alert(1)" },
      });
      expect(bad.status).toBe(400);

      // Restore the real public URL for the publish test.
      await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: { siteUrl: PUBLIC_URL },
      });
    });

    test("publish article → Telegram messages to ALL destinations with bilingual buttons → public site opens in each language", async ({ page, request }) => {
      // Enable auto-publish + add a personal chat as a third destination.
      const enable = await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: {
          enabled: true,
          languageMode: "both",
          destinations: [
            { chatId: CHANNEL, type: "channel" },
            { chatId: SUPERGROUP, type: "supergroup" },
            { chatId: PERSONAL, type: "private" },
          ],
        },
      });
      expect(enable.status).toBe(200);

      await resetMock(request);
      // Real device-style image upload → MinIO.
      const imageUrl = await uploadTestImage(request, token);

      const stamp = Date.now();
      const titleKh = `អត្ថបទសាកល្បង Telegram ${stamp}`;
      const titleEn = `Telegram Test Article ${stamp}`;

      const cats = await api(request, "/admin/categories", token);
      const categoryId = ((cats.data as { id: number }[]) ?? [])[0]?.id;
      expect(categoryId).toBeTruthy();

      const created = await api(request, "/admin/articles", token, {
        method: "POST",
        body: {
          title: titleKh,
          titleEn,
          excerpt: "សេចក្តីសង្ខេបសម្រាប់តេស្ត",
          excerptEn: "Test summary",
          content: "<p>ខ្លឹមសារខ្មែរ</p>",
          contentEn: "<p>English content</p>",
          categoryId,
          featuredImage: imageUrl,
          status: "PUBLISHED",
          tagIds: [],
        },
      });
      expect(created.status).toBe(201);
      articleId = (created.data as { id: number }).id;
      articleSlug = (created.data as { slug: string }).slug;

      // The worker should publish to all 3 destinations quickly.
      let pubs: { status: string; chatId: string | null; telegramMessageId: number | null }[] = [];
      await expect
        .poll(
          async () => {
            const r = await api(request, `/admin/articles/${articleId}/telegram`, token);
            pubs = r.data as { status: string; chatId: string | null; telegramMessageId: number | null }[];
            return pubs.length && pubs.every((p) => p.status === "PUBLISHED") ? "done" : undefined;
          },
          { timeout: 30_000, intervals: [500, 1000, 2000] }
        )
        .toBe("done");
      expect(pubs).toHaveLength(3);
      const chatIds = pubs.map((p) => p.chatId).sort();
      expect(chatIds).toEqual([CHANNEL, PERSONAL, SUPERGROUP].sort());
      expect(pubs.every((p) => p.telegramMessageId)).toBe(true);

      // The mock received a sendPhoto per destination.
      const sends = await mockSends(request);
      expect(sends.length).toBe(3);
      const targetChats = sends.map((s) => s.chat_id).sort();
      expect(targetChats).toEqual([CHANNEL, PERSONAL, SUPERGROUP].sort());

      // When PUBLIC_URL is a public domain, inline buttons are sent.
      // When it is localhost/private, the URL appears as plain text in the
      // caption and reply_markup is null.
      const isLocal = /^https?:\/\/((localhost|127\.0\.0\.1)(:\d+)?|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(PUBLIC_URL);
      for (const send of sends) {
        expect(send.caption).toContain(`<b>${titleKh}</b>`);
        expect(send.parse_mode).toBe("HTML");
        expect(send.photo).toBeTruthy();
        // The 1×1 test PNG is ~70 bytes — prove real bytes were uploaded.
        expect(send.photo!.size).toBeGreaterThan(50);
        if (isLocal) {
          // Local URL: no inline button, URL in caption as plain text.
          expect(send.reply_markup).toBeNull();
          expect(send.caption).toContain(`${PUBLIC_URL}/kh/news/${articleSlug}`);
        } else {
          // Public URL: inline buttons with Khmer + English links.
          const buttons = send.reply_markup!.inline_keyboard[0];
          expect(buttons).toHaveLength(2);
          const urls = buttons.map((b) => b.url);
          expect(urls).toContain(`${PUBLIC_URL}/kh/news/${articleSlug}`);
          expect(urls).toContain(`${PUBLIC_URL}/en/news/${articleSlug}`);
        }
      }

      // Khmer URL renders Khmer immediately (lang from URL wins).
      await page.goto(`${PUBLIC_URL}/kh/news/${articleSlug}`);
      await expect(page).toHaveURL(new RegExp(`/kh/news/${articleSlug}$`));
      await expect(page.locator("html")).toHaveAttribute("lang", "km");
      await expect(page.locator("h1.news-title")).toContainText(titleKh);

      // English URL renders English immediately.
      await page.goto(`${PUBLIC_URL}/en/news/${articleSlug}`);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("h1.news-title")).toContainText(titleEn);

      // In-site switcher keeps the same article and flips the URL.
      await page.locator(".language-switcher button", { hasText: "ខ្មែរ" }).first().click();
      await expect(page).toHaveURL(new RegExp(`/kh/news/${articleSlug}$`));
      await expect(page.locator("html")).toHaveAttribute("lang", "km");
    });

    test("duplicate send blocked — send again (force) works", async ({ request }) => {
      expect(articleId).toBeTruthy();

      const blocked = await api(request, `/admin/articles/${articleId}/telegram/send`, token, {
        method: "POST",
        body: {},
      });
      expect(blocked.status).toBe(409);

      const before = await mockSends(request);
      const resend = await api(request, `/admin/articles/${articleId}/telegram/send`, token, {
        method: "POST",
        body: { force: true },
      });
      expect(resend.status).toBe(200);

      await expect
        .poll(
          async () => {
            const r = await api(request, `/admin/articles/${articleId}/telegram`, token);
            const pubs = r.data as { status: string }[];
            return pubs.length && pubs.every((p) => p.status === "PUBLISHED") ? "done" : undefined;
          },
          { timeout: 30_000, intervals: [500, 1000, 2000] }
        )
        .toBe("done");

      const after = await mockSends(request);
      expect(after.length).toBe(before.length + 3);
    });

    test("auto-publish OFF — publishing creates no Telegram job", async ({ request }) => {
      const disable = await api(request, "/admin/settings/telegram", token, {
        method: "PUT",
        body: { enabled: false },
      });
      expect(disable.status).toBe(200);

      const imageUrl = await uploadTestImage(request, token);
      const cats = await api(request, "/admin/categories", token);
      const categoryId = ((cats.data as { id: number }[]) ?? [])[0]?.id;

      const created = await api(request, "/admin/articles", token, {
        method: "POST",
        body: {
          title: `Auto-off test ${Date.now()}`,
          categoryId,
          featuredImage: imageUrl,
          content: "<p>x</p>",
          status: "PUBLISHED",
          tagIds: [],
        },
      });
      expect(created.status).toBe(201);
      const id = (created.data as { id: number }).id;

      // Give a would-be job time to appear — it must not.
      await new Promise((r) => setTimeout(r, 4000));
      const pub = await api(request, `/admin/articles/${id}/telegram`, token);
      expect(pub.status).toBe(200);
      expect(pub.data).toEqual([]);
    });
  });
});
