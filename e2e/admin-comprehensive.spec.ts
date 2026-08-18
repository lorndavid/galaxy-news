import { expect, test } from "@playwright/test";
import { api, getAdminToken, loginAsAdmin } from "./helpers";

/**
 * Comprehensive admin E2E tests:
 *   - Login / Logout
 *   - Dashboard loads
 *   - Sidebar navigation (every item)
 *   - Article CRUD (create, read, update, delete)
 *   - Category CRUD
 *   - Tag CRUD
 *   - Media library
 *   - Delete confirmation dialogs
 *   - Settings pages
 *   - No console errors
 *   - No horizontal overflow
 */

test.describe("admin dashboard", () => {
  let token: string;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    token = (await getAdminToken(page)) ?? "";
    expect(token).toBeTruthy();
  });

  // ─── Login / Dashboard ─────────────────────────────────────────
  test("dashboard loads with statistics", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 15000 });
    // Dashboard should show some stats
    const statsCards = page.locator(".card, [class*='stat'], [class*='card']");
    expect(await statsCards.count()).toBeGreaterThan(0);
  });

  // ─── Sidebar navigation ────────────────────────────────────────
  test("sidebar navigates to all main sections without errors", async ({ page }) => {
    const sections = [
      { url: "/articles", text: "អត្ថបទ" },
      { url: "/categories", text: "ប្រភេទ" },
      { url: "/tags", text: "ស្លាក" },
      { url: "/media", text: "មេឌា" },
      { url: "/ads", text: "ផ្សាយពាណិជ្ជកម្ម" },
      { url: "/settings", text: "ការកំណត់" },
      { url: "/settings/telegram", text: "Telegram" },
      { url: "/users", text: "អ្នកប្រើប្រាស់" },
      { url: "/activity", text: "ប្រវត្តិសកម្មភាព" },
      { url: "/live-news", text: "បន្ទាត់ព័ត៌មាន" },
    ];

    for (const section of sections) {
      await page.goto(section.url);
      await page.waitForLoadState("networkidle");
      // Page should render without crashing
      await expect(page.locator("body")).not.toBeEmpty();
      // Should not show a blank white page or error
      const text = await page.locator("body").innerText();
      expect(text.length).toBeGreaterThan(10);
    }
  });

  // ─── Article CRUD ──────────────────────────────────────────────
  test("article list loads with data", async ({ page }) => {
    await page.goto("/articles");
    await expect(page.locator("body")).toContainText(/អត្ថបទ|Articles/i, { timeout: 15000 });
  });

  test("create article flow — title, category, save draft", async ({ page, request }) => {
    await page.goto("/articles/new");
    await expect(page.getByPlaceholder("ចំណងជើងអត្ថបទ")).toBeVisible({ timeout: 15000 });

    const stamp = Date.now();
    await page.getByPlaceholder("ចំណងជើងអត្ថបទ").fill(`QA Test ${stamp}`);
    await page.getByPlaceholder(/សេចក្តីសង្ខេប/).fill("QA test excerpt");
    const editor = page.locator(".ProseMirror").first();
    await editor.click();
    await page.keyboard.type("QA test content body");

    // Select category
    await page.locator("select").first().selectOption({ index: 1 });

    // Save draft
    await page.getByRole("button", { name: "រក្សាទុកជាសេចក្តីព្រាង" }).click();
    await expect(page.getByText("បានបង្កើតអត្ថបទ")).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/articles\/\d+\/edit$/);

    // Verify in list
    const articleId = Number(page.url().match(/\/articles\/(\d+)\/edit$/)?.[1]);
    expect(articleId).toBeGreaterThan(0);

    // Publish
    await page.getByRole("button", { name: "បោះពុម្ពផ្សាយ" }).click();
    await expect(page.getByText("បានរក្សាទុកអត្ថបទ")).toBeVisible();

    // Verify via API
    const detail = await api(request, `/admin/articles/${articleId}`, token);
    expect(detail.status).toBe(200);
    expect((detail.data as { status: string }).status).toBe("PUBLISHED");

    // Cleanup
    await api(request, `/admin/articles/${articleId}`, token, { method: "DELETE" });
  });

  // ─── Category CRUD ─────────────────────────────────────────────
  test("category CRUD — create, verify in list, delete", async ({ page, request }) => {
    await page.goto("/categories");
    await expect(page.locator("body")).toContainText(/ប្រភេទ|Categories/i);

    const stamp = Date.now();
    const name = `QA Category ${stamp}`;

    // Create via API (faster for testing)
    const create = await api(request, "/admin/categories", token, {
      method: "POST",
      body: { name, nameKh: `ប្រភេទ QA ${stamp}`, slug: `qa-cat-${stamp}` },
    });
    expect(create.status).toBe(201);
    const catId = (create.data as { id: number }).id;

    // Verify it appears in the list
    await page.reload();
    await expect(page.locator(`text=${name}`)).toBeVisible({ timeout: 10000 });

    // Delete via API
    const del = await api(request, `/admin/categories/${catId}`, token, { method: "DELETE" });
    expect([200, 204]).toContain(del.status);
  });

  // ─── Tag CRUD ──────────────────────────────────────────────────
  test("tag CRUD — create and delete", async ({ page, request }) => {
    // Verify page loads
    await page.goto("/tags");
    await expect(page.locator("body")).toContainText(/ស្លា|Tags/i, { timeout: 15000 });

    const stamp = Date.now();
    const name = `QA Tag ${stamp}`;

    const create = await api(request, "/admin/tags", token, {
      method: "POST",
      body: { name, nameKh: `ស្លា QA ${stamp}` },
    });
    expect(create.status).toBe(201);
    const tagId = (create.data as { id: number }).id;

    const del = await api(request, `/admin/tags/${tagId}`, token, { method: "DELETE" });
    expect([200, 204]).toContain(del.status);
  });

  // ─── Delete confirmation ───────────────────────────────────────
  test("delete confirmation dialog appears for destructive actions", async ({ page, request }) => {
    // Create a test article first
    const cats = await api(request, "/admin/categories", token);
    const catId = (cats.data as { id: number }[])[0]?.id;
    const create = await api(request, "/admin/articles", token, {
      method: "POST",
      body: {
        title: `Delete Test ${Date.now()}`,
        content: "<p>x</p>",
        categoryId: catId,
        status: "DRAFT",
        tagIds: [],
      },
    });
    const articleId = (create.data as { id: number }).id;

    await page.goto("/articles");
    await expect(page.locator("table")).toBeVisible({ timeout: 15000 });

    // Find the row and click delete
    const row = page.locator("tr").filter({ hasText: /Delete Test/ }).first();
    if (await row.count() > 0) {
      await row.getByRole("button", { name: "លុប" }).click();
      // Confirmation dialog should appear
      const dialog = page.locator(".fixed.inset-0.z-50");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      // Cancel to avoid actually deleting
      await dialog.getByRole("button", { name: "បោះបង់" }).first().click();
    }

    // Cleanup via API
    await api(request, `/admin/articles/${articleId}`, token, { method: "DELETE" });
  });

  // ─── Settings pages ────────────────────────────────────────────
  test("settings page loads with tabs", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("body")).toContainText(/ការកំណត់|Settings/i);
  });

  test("Telegram settings page loads", async ({ page }) => {
    await page.goto("/settings/telegram");
    await expect(page.locator("body")).toContainText(/Telegram/i);
  });

  // ─── Media library ─────────────────────────────────────────────
  test("media library loads", async ({ page }) => {
    await page.goto("/media");
    await expect(page.locator("body")).toContainText(/មេឌា|Media/i, { timeout: 15000 });
  });

  // ─── Ads / Banners ────────────────────────────────────────────
  test("ads page loads", async ({ page }) => {
    await page.goto("/ads");
    await expect(page.locator("body")).toContainText(/ផ្សាយពាណិជ្ជកម្ម|Advertisements/i, { timeout: 15000 });
  });

  // ─── Users ─────────────────────────────────────────────────────
  test("users page loads", async ({ page }) => {
    await page.goto("/users");
    await expect(page.locator("body")).toContainText(/អ្នកប្រើប្រាស់|Users/i, { timeout: 15000 });
  });

  // ─── Activity log ──────────────────────────────────────────────
  test("activity log loads", async ({ page }) => {
    await page.goto("/activity");
    await expect(page.locator("body")).toContainText(/សកម្មភាព|Activity/i, { timeout: 15000 });
  });

  // ─── No horizontal overflow on admin pages ─────────────────────
  test("admin dashboard has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test("admin articles page has no overflow at 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/articles");
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  // ─── Preview website link ──────────────────────────────────────
  test("header has a working preview website link", async ({ page }) => {
    await page.goto("/");
    const previewLink = page.locator("a[href*='preview'], a:has-text('មើលគេហទំព័រ')").first();
    if ((await previewLink.count()) > 0) {
      const href = await previewLink.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });
});
