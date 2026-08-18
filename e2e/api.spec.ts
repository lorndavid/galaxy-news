import { expect, test } from "@playwright/test";
import { api, getAdminToken, loginAsAdmin } from "./helpers";

/**
 * Comprehensive backend API test suite.
 *
 * API response shapes:
 *   articles/media/comments/activity → { items, page, pageSize, total, totalPages }
 *   categories/tags/ads/navigation   → flat array
 *   settings                         → flat object
 *   ticker                           → { enabled, title, items, ... }
 *   DELETE → 204 No Content
 *   Article update → PATCH not PUT
 */

test.describe("backend API", () => {
  let token: string;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    token = (await getAdminToken(page)) ?? "";
    expect(token).toBeTruthy();
  });

  // ─── Health ────────────────────────────────────────────────────
  test("GET /health returns ok with all dependencies", async ({ request }) => {
    const res = await request.get("http://localhost:4000/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.dependencies.database).toBe("ok");
    expect(body.data.dependencies.redis).toBe("ok");
    expect(body.data.dependencies.minio).toBe("ok");
  });

  // ─── Authentication ────────────────────────────────────────────
  test("POST /auth/login — valid credentials return token", async ({ request }) => {
    const res = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { email: "superadmin@navatra.tv", password: "admin123" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.user.email).toBe("superadmin@navatra.tv");
  });

  test("POST /auth/login — invalid password is rejected", async ({ request }) => {
    const res = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { email: "superadmin@navatra.tv", password: "wrongpassword123" },
    });
    expect([400, 401]).toContain(res.status());
  });

  test("POST /auth/login — missing fields returns 400", async ({ request }) => {
    const res = await request.post("http://localhost:4000/api/v1/auth/login", {
      data: { email: "superadmin@navatra.tv" },
    });
    expect(res.status()).toBe(400);
  });

  test("GET /auth/me — returns current user with valid token", async ({ request }) => {
    const res = await api(request, "/auth/me", token);
    expect(res.status).toBe(200);
    const user = res.data as { email: string; role: string };
    expect(user.email).toBe("superadmin@navatra.tv");
    expect(user.role).toBe("SUPER_ADMIN");
  });

  test("GET /auth/me — 401 without token", async ({ request }) => {
    const res = await api(request, "/auth/me", null);
    expect(res.status).toBe(401);
  });

  // ─── Articles CRUD ─────────────────────────────────────────────
  test("GET /articles — public list (paginated)", async ({ request }) => {
    const res = await api(request, "/articles", null);
    expect(res.status).toBe(200);
    const data = res.data as { items: unknown[]; total: number };
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
  });

  test("GET /articles?category= — filters by category", async ({ request }) => {
    const cats = await api(request, "/categories", null);
    const catId = (cats.data as { id: number }[])[0]?.id;
    const res = await api(request, `/articles?category=${catId}`, null);
    expect(res.status).toBe(200);
    const data = res.data as { items: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("GET /articles?search= — search works", async ({ request }) => {
    const res = await api(request, "/articles?search=AI", null);
    expect(res.status).toBe(200);
    const data = res.data as { items: unknown[] };
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("GET /articles/:slug — single article", async ({ request }) => {
    const list = await api(request, "/articles", null);
    const slug = (list.data as { items: { slug: string }[] }).items[0]?.slug;
    expect(slug).toBeTruthy();
    const res = await api(request, `/articles/${slug}`, null);
    expect(res.status).toBe(200);
    expect((res.data as { slug: string }).slug).toBe(slug);
  });

  test("GET /articles/nonexistent — 404", async ({ request }) => {
    const res = await api(request, "/articles/this-slug-does-not-exist-999", null);
    expect(res.status).toBe(404);
  });

  test("GET /admin/articles — requires auth", async ({ request }) => {
    const res = await api(request, "/admin/articles", null);
    expect(res.status).toBe(401);
  });

  test("GET /admin/articles — paginated with translations", async ({ request }) => {
    const res = await api(request, "/admin/articles", token);
    expect(res.status).toBe(200);
    const data = res.data as { items: { title: string }[] };
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0].title).toBeTruthy();
  });

  test("POST /admin/articles — validation rejects missing title", async ({ request }) => {
    const cats = await api(request, "/admin/categories", token);
    const catId = (cats.data as { id: number }[])[0]?.id;
    const res = await api(request, "/admin/articles", token, {
      method: "POST",
      body: { categoryId: catId, content: "test" },
    });
    expect(res.status).toBe(400);
  });

  test("POST + PATCH + DELETE article — full lifecycle", async ({ request }) => {
    const cats = await api(request, "/admin/categories", token);
    const catId = (cats.data as { id: number }[])[0]?.id;

    // Create
    const create = await api(request, "/admin/articles", token, {
      method: "POST",
      body: { title: `Lifecycle Test ${Date.now()}`, content: "<p>test</p>", categoryId: catId, status: "DRAFT", tagIds: [] },
    });
    expect(create.status).toBe(201);
    const id = (create.data as { id: number }).id;

    // Update (articles use PATCH)
    const upd = await api(request, `/admin/articles/${id}`, token, {
      method: "PATCH",
      body: { title: `Updated ${Date.now()}` },
    });
    expect(upd.status).toBe(200);

    // Delete
    const del = await api(request, `/admin/articles/${id}`, token, { method: "DELETE" });
    expect([200, 204]).toContain(del.status);

    // Verify gone
    const gone = await api(request, `/admin/articles/${id}`, token);
    expect(gone.status).toBe(404);
  });

  // ─── Categories CRUD ───────────────────────────────────────────
  test("GET /categories — flat array", async ({ request }) => {
    const res = await api(request, "/categories", null);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect((res.data as unknown[]).length).toBeGreaterThan(0);
  });

  test("POST + DELETE category", async ({ request }) => {
    const stamp = Date.now();
    const create = await api(request, "/admin/categories", token, {
      method: "POST",
      body: { name: `Test Cat ${stamp}`, slug: `test-cat-${stamp}` },
    });
    expect(create.status).toBe(201);
    const catId = (create.data as { id: number }).id;

    const del = await api(request, `/admin/categories/${catId}`, token, { method: "DELETE" });
    expect([200, 204]).toContain(del.status);
  });

  // ─── Tags CRUD ─────────────────────────────────────────────────
  test("GET /admin/tags — flat array", async ({ request }) => {
    const res = await api(request, "/admin/tags", token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test("POST + DELETE tag", async ({ request }) => {
    const stamp = Date.now();
    const create = await api(request, "/admin/tags", token, {
      method: "POST",
      body: { name: `Test Tag ${stamp}`, nameKh: `ស្លា ${stamp}` },
    });
    expect(create.status).toBe(201);
    const tagId = (create.data as { id: number }).id;

    const del = await api(request, `/admin/tags/${tagId}`, token, { method: "DELETE" });
    expect([200, 204]).toContain(del.status);
  });

  // ─── Settings ──────────────────────────────────────────────────
  test("GET /settings — public flat object", async ({ request }) => {
    const res = await api(request, "/settings", null);
    expect(res.status).toBe(200);
    expect((res.data as Record<string, unknown>).siteName).toBeTruthy();
  });

  test("GET /admin/settings — requires auth", async ({ request }) => {
    const res = await api(request, "/admin/settings", null);
    expect(res.status).toBe(401);
  });

  // ─── Navigation ────────────────────────────────────────────────
  test("GET /navigation — flat array", async ({ request }) => {
    const res = await api(request, "/navigation", null);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  // ─── Media ─────────────────────────────────────────────────────
  test("GET /admin/media — paginated", async ({ request }) => {
    const res = await api(request, "/admin/media", token);
    expect(res.status).toBe(200);
    expect(Array.isArray((res.data as { items: unknown[] }).items)).toBe(true);
  });

  // ─── Ads ───────────────────────────────────────────────────────
  test("GET /admin/ads — flat array", async ({ request }) => {
    const res = await api(request, "/admin/ads", token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  // ─── Ticker ────────────────────────────────────────────────────
  test("GET /ticker — config with items", async ({ request }) => {
    const res = await api(request, "/ticker", null);
    expect(res.status).toBe(200);
    const data = res.data as { enabled: boolean; items: unknown[]; title: string };
    expect(typeof data.enabled).toBe("boolean");
    expect(Array.isArray(data.items)).toBe(true);
  });

  // ─── Comments ──────────────────────────────────────────────────
  test("GET /admin/comments — paginated", async ({ request }) => {
    const res = await api(request, "/admin/comments", token);
    expect(res.status).toBe(200);
    expect(Array.isArray((res.data as { items: unknown[] }).items)).toBe(true);
  });

  // ─── Users ─────────────────────────────────────────────────────
  test("GET /admin/users — paginated, no password field", async ({ request }) => {
    const res = await api(request, "/admin/users", token);
    expect(res.status).toBe(200);
    const data = res.data as { items: Record<string, unknown>[] };
    expect(Array.isArray(data.items)).toBe(true);
    for (const u of data.items) {
      expect(u.password).toBeUndefined();
      expect(u.passwordHash).toBeUndefined();
    }
  });

  // ─── Activity ──────────────────────────────────────────────────
  test("GET /admin/activity — paginated", async ({ request }) => {
    const res = await api(request, "/admin/activity", token);
    expect(res.status).toBe(200);
    expect(Array.isArray((res.data as { items: unknown[] }).items)).toBe(true);
  });

  // ─── Pagination ────────────────────────────────────────────────
  test("GET /articles — respects pageSize param", async ({ request }) => {
    const res = await api(request, "/articles?page=1&pageSize=2", null);
    const data = res.data as { items: unknown[]; pageSize: number };
    expect(data.items.length).toBeLessThanOrEqual(2);
    expect(data.pageSize).toBe(2);
  });

  // ─── Error handling ────────────────────────────────────────────
  test("POST /admin/articles — clean validation error", async ({ request }) => {
    const res = await api(request, "/admin/articles", token, {
      method: "POST",
      body: { title: "x" },
    });
    expect(res.status).toBe(400);
    expect(res.message).toBeTruthy();
  });

  test("GET /admin/articles/999999 — 404", async ({ request }) => {
    const res = await api(request, "/admin/articles/999999", token);
    expect(res.status).toBe(404);
  });
});
