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

    await page.getByPlaceholder("ចំណងជើងអត្ថបទ").fill(TITLE);
    await page
      .getByPlaceholder(/សេចក្តីសង្ខេប/)
      .fill(EXCERPT);
    const editor = page.locator(".ProseMirror").first();
    await editor.click();
    await page.keyboard.type(BODY_TEXT);

    await page.locator("select").first().selectOption({ index: 1 });

    await page.getByRole("button", { name: "រក្សាទុកជាសេចក្តីព្រាង" }).click();
    await expect(page.getByText("បានបង្កើតអត្ថបទ")).toBeVisible();
    await expect(page).toHaveURL(/\/articles\/\d+\/edit$/);

    articleId = Number(page.url().match(/\/articles\/(\d+)\/edit$/)?.[1]);
    expect(articleId).toBeGreaterThan(0);
    token = (await getAdminToken(page)) ?? "";
    expect(token).toBeTruthy();

    await page.getByRole("button", { name: "បោះពុម្ពផ្សាយ" }).click();
    await expect(page.getByText("បានរក្សាទុកអត្ថបទ")).toBeVisible();

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

    const detail = await api(request, `/admin/articles/${articleId}`, token);
    expect(detail.status).toBe(200);
    const article = detail.data as { title: string; slug: string };
    expect(article.title).toBe(UPDATED_TITLE);
    slug = article.slug;

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
    await page.goto("/articles");
    await expect(page.locator("table")).toBeVisible();
    const row = page.locator("tr", { hasText: UPDATED_TITLE }).first();
    await expect(row).toBeVisible();
    await row.locator("button.text-red-600, button:has(.lucide-trash-2)").first().click({ force: true });

    const dialog = page.locator(".fixed.inset-0.z-50", { hasText: "បញ្ជាក់ការលុប" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "លុប" }).click();
    await expect(page.getByText("បានលុបអត្ថបទ")).toBeVisible();

    const admin = await api(request, `/admin/articles/${articleId}`, token);
    expect(admin.status).toBe(404);
    const pub = await api(request, `/articles/${slug}`, null);
    expect(pub.status).toBe(404);

    // Use domcontentloaded to avoid slow external resource load timeouts
    await page.goto(`${PUBLIC_URL}/article/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("h1.news-title")).toHaveCount(0);
    await expect(page.getByText(/មិនអាចផ្ទុកអត្ថបទ|not found|មិនមាន/i)).toBeVisible();
  });
});
