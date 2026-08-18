import { expect, test } from "@playwright/test";
import { api, getAdminToken, loginAsAdmin } from "./helpers";

test.describe("security", () => {
  let token: string;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    token = (await getAdminToken(page)) ?? "";
    expect(token).toBeTruthy();
  });

  test("admin APIs reject unauthenticated requests", async ({ request }) => {
    const endpoints = ["/admin/articles", "/admin/categories", "/admin/tags", "/admin/media", "/admin/users", "/admin/ads", "/admin/settings", "/admin/comments", "/admin/activity"];
    for (const path of endpoints) {
      const res = await api(request, path, null);
      expect(res.status, `${path} should be 401`).toBe(401);
    }
  });

  test("public APIs work without authentication", async ({ request }) => {
    const endpoints = ["/articles", "/categories", "/settings", "/navigation", "/ticker"];
    for (const path of endpoints) {
      const res = await api(request, path, null);
      expect(res.status, `${path} should be 200`).toBe(200);
    }
  });

  test("Telegram bot token is never returned in public settings", async ({ request }) => {
    const res = await api(request, "/settings", null);
    expect(res.status).toBe(200);
    const data = res.data as Record<string, unknown>;
    expect(data.telegramBotToken).toBeUndefined();
  });

  test("admin settings masks the Telegram bot token", async ({ request }) => {
    // Read the current settings — the token should be masked
    const res = await api(request, "/admin/settings/telegram", token);
    expect(res.status).toBe(200);
    const data = res.data as { botTokenMasked: string };
    // If a token is stored, it should be masked (contain *)
    if (data.botTokenMasked && data.botTokenMasked.length > 0) {
      expect(data.botTokenMasked).toContain("*");
    }
    // The raw token must never appear
    expect(JSON.stringify(data)).not.toContain("TEST_BOT_TOKEN");
  });

  test("user passwords are never returned", async ({ request }) => {
    const res = await api(request, "/admin/users", token);
    expect(res.status).toBe(200);
    const users = (res.data as { items: Record<string, unknown>[] }).items;
    for (const u of users) {
      expect(u.password).toBeUndefined();
      expect(u.passwordHash).toBeUndefined();
    }
  });

  test("MinIO credentials never in public settings", async ({ request }) => {
    const res = await api(request, "/settings", null);
    const data = res.data as Record<string, unknown>;
    expect(data.minioSecretKey).toBeUndefined();
    expect(data.minioAccessKey).toBeUndefined();
  });

  test("search handles malicious input safely", async ({ request }) => {
    const res = await api(request, "/articles?search=' OR 1=1 --", null);
    expect(res.status).toBe(200);
    const data = res.data as { items: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("article with script tags stored safely", async ({ request }) => {
    const cats = await api(request, "/admin/categories", token);
    const catId = (cats.data as { id: number }[])[0]?.id;

    const create = await api(request, "/admin/articles", token, {
      method: "POST",
      body: {
        title: `XSS Test ${Date.now()}`,
        content: '<p>Safe</p><script>alert("xss")</script>',
        categoryId: catId,
        status: "DRAFT",
        tagIds: [],
      },
    });
    expect(create.status).toBe(201);
    const article = create.data as { id: number; slug: string };

    // Draft articles may not appear on public API — use admin endpoint
    const detail = await api(request, `/admin/articles/${article.id}`, token);
    expect(detail.status).toBe(200);
    const data = detail.data as { content: string };
    // Content should be sanitized — no raw script tags
    expect(data.content).not.toContain("<script>");

    await api(request, `/admin/articles/${article.id}`, token, { method: "DELETE" });
  });

  test("Telegram settings require admin auth", async ({ request }) => {
    const endpoints = [
      { method: "GET", path: "/admin/settings/telegram" },
      { method: "POST", path: "/admin/settings/telegram/discover" },
    ];
    for (const ep of endpoints) {
      const res = await api(request, ep.path, null, { method: ep.method });
      expect(res.status, `${ep.method} ${ep.path}`).toBe(401);
    }
  });

  test("article mutation requires admin token", async ({ request }) => {
    const create = await api(request, "/admin/articles", null, {
      method: "POST",
      body: { title: "test", content: "test", status: "DRAFT", tagIds: [] },
    });
    expect(create.status).toBe(401);

    const update = await api(request, "/admin/articles/1", null, {
      method: "PATCH",
      body: { title: "test" },
    });
    expect(update.status).toBe(401);

    const del = await api(request, "/admin/articles/1", null, { method: "DELETE" });
    expect(del.status).toBe(401);
  });
});
