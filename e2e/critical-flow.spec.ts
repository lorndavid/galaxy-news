import { expect, test } from "@playwright/test";
import { PUBLIC_URL } from "../playwright.config";
import {
  api,
  getAdminToken,
  getArticleSlug,
  loginAsAdmin,
} from "./helpers";

/**
 * Critical E2E flow (§81 of the platform spec):
 *   Admin Login → Create Article → Save Draft → Publish →
 *   Open Public Website → Verify Article → Edit → Verify Update →
 *   Delete → Verify Removal.
 *
 * Every step goes through the real UI (or the real API for lookups like
 * the generated slug) — no mocked state.
 */

const stamp = Date.now();
const TITLE = `E2E Publish Test ${stamp}`;
const UPDATED_TITLE = `E2E Publish Test (updated) ${stamp}`;
const EXCERPT = `E2E excerpt for the critical publish flow — ${stamp}`;
const BODY_TEXT = `This is the E2E article body. Unique marker: ${stamp}.`;
const UPDATED_BODY_TEXT = `Body was edited during the E2E run. Marker: ${stamp}.`;

test.describe.serial("critical admin publish flow", () => {
  let articleId: number;
  let slug: string;
  let token: string;

  // Each test gets a fresh browser context (fresh localStorage), so sign in
  // through the real login UI before every step of the flow.
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("creates an article, saves draft, then publishes it", async ({
    page,
    request,
  }) => {
    await page.goto("/articles");
    await expect(page.getByText("អត្ថបទថ្មី").first()).toBeVisible();
    await page.getByText("អត្ថបទថ្មី").first().click();
    await expect(page).toHaveURL(/\/articles\/new$/);

    // Title / excerpt / content (TipTap contenteditable)
    await page.getByPlaceholder("ចំណងជើងអត្ថបទ").fill(TITLE);
    await page
      .getByPlaceholder(/សេចក្តីសង្ខេប/)
      .fill(EXCERPT);
    const editor = page.locator(".ProseMirror").first();
    await editor.click();
    await page.keyboard.type(BODY_TEXT);

    // Category — first select in the sidebar is the category picker.
    await page.locator("select").first().selectOption({ index: 1 });

    // Save as draft first (real CRUD → DB), then verify toast + redirect.
    await page.getByRole("button", { name: "រក្សាទុកជាសេចក្តីព្រាង" }).click();
    await expect(page.getByText("បានបង្កើតអត្ថបទ")).toBeVisible();
    await expect(page).toHaveURL(/\/articles\/\d+\/edit$/);

    articleId = Number(page.url().match(/\/articles\/(\d+)\/edit$/)?.[1]);
    expect(articleId).toBeGreaterThan(0);
    token = (await getAdminToken(page)) ?? "";
    expect(token).toBeTruthy();

    // Publish through the UI.
    await page.getByRole("button", { name: "បោះពុម្ពផ្សាយ" }).click();
    await expect(page.getByText("បានរក្សាទុកអត្ថបទ")).toBeVisible();

    // Confirm the API state is PUBLISHED and grab the generated slug.
    const detail = await api(request, `/admin/articles/${articleId}`, token);
    expect(detail.status).toBe(200);
    const article = detail.data as {
      status: string;
      slug: string;
      isBreaking: boolean;
      isFeatured: boolean;
    };
    expect(article.status).toBe("PUBLISHED");
    slug = article.slug;
  });

  test("article is live on the public website", async ({ page }) => {
    expect(slug).toBeTruthy();
    await page.goto(`${PUBLIC_URL}/article/${slug}`);
    await expect(page.locator("h1.news-title")).toContainText(TITLE, {
      timeout: 20_000,
    });
    await expect(page.locator(".news-content")).toContainText(BODY_TEXT);
    await expect(page.locator(".news-lead")).toContainText(EXCERPT);
  });

  test("edits the article and the public site reflects the update", async ({
    page,
    request,
  }) => {
    await page.goto(`/articles/${articleId}/edit`);
    await expect(page.getByPlaceholder("ចំណងជើងអត្ថបទ")).toHaveValue(TITLE);

    await page.getByPlaceholder("ចំណងជើងអត្ថបទ").fill(UPDATED_TITLE);
    const editor = page.locator(".ProseMirror").first();
    await editor.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(UPDATED_BODY_TEXT);

    await page.getByRole("button", { name: "បោះពុម្ពផ្សាយ" }).click();
    await expect(page.getByText("បានរក្សាទុកអត្ថបទ")).toBeVisible();

    // The title changed, so the backend regenerates the slug — re-fetch it.
    const detail = await api(request, `/admin/articles/${articleId}`, token);
    expect(detail.status).toBe(200);
    const article = detail.data as { title: string; slug: string };
    expect(article.title).toBe(UPDATED_TITLE);
    slug = article.slug;

    // Cache invalidation is awaited — a fresh public fetch must show the update.
    const fresh = await api(request, `/articles/${slug}`, null);
    expect(fresh.status).toBe(200);
    const updated = fresh.data as { title: string };
    expect(updated.title).toBe(UPDATED_TITLE);

    await page.goto(`${PUBLIC_URL}/article/${slug}`);
    await expect(page.locator("h1.news-title")).toContainText(UPDATED_TITLE, {
      timeout: 20_000,
    });
    await expect(page.locator(".news-content")).toContainText(UPDATED_BODY_TEXT);
  });

  test("deletes the article and verifies removal", async ({ page, request }) => {
    // Delete through the admin UI (row action → confirmation dialog).
    await page.goto("/articles");
    await expect(page.locator("table")).toBeVisible();
    const row = page.locator("tr", { hasText: UPDATED_TITLE }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "លុប" }).click();

    // ConfirmDialog — confirm button labelled លុប inside the dialog.
    const dialog = page.locator(".fixed.inset-0.z-50", { hasText: "បញ្ជាក់ការលុប" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "លុប" }).click();
    await expect(page.getByText("បានលុបអត្ថបទ")).toBeVisible();

    // API: gone from admin and from the public site (404 + no stale cache).
    const admin = await api(request, `/admin/articles/${articleId}`, token);
    expect(admin.status).toBe(404);
    const pub = await api(request, `/articles/${slug}`, null);
    expect(pub.status).toBe(404);

    // Public page renders the error state instead of the article.
    await page.goto(`${PUBLIC_URL}/article/${slug}`);
    await expect(page.locator("h1.news-title")).toHaveCount(0);
    await expect(page.getByText(/មិនអាចផ្ទុកអត្ថបទ|not found|មិនមាន/i)).toBeVisible();
  });
});
