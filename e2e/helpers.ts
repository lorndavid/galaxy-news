import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { ADMIN_URL, API_URL } from "../playwright.config";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "superadmin@navatra.tv";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";

/** Sign in through the real admin UI and wait for the dashboard. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${ADMIN_URL}/login`);
  await page.fill("#email", ADMIN_EMAIL);
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(new RegExp(`^${ADMIN_URL}/?$`), { timeout: 20_000 });
  // Dashboard is rendered once the API fetch resolves.
  await expect(page.locator("h2").first()).toBeVisible({ timeout: 20_000 });
}

/** Read the JWT the admin SPA stored in localStorage after login. */
export function getAdminToken(page: Page): string | null {
  return page.evaluate(() => localStorage.getItem("navatra_admin_token"));
}

/** Small typed wrapper around the backend API (relative to /api/v1). */
export async function api(
  request: APIRequestContext,
  path: string,
  token: string | null,
  init: { method?: string; body?: unknown } = {}
) {
  const res = await request.fetch(`${API_URL}/api/v1${path}`, {
    method: init.method ?? "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    data: init.body,
  });
  const json = (await res.json().catch(() => null)) as
    | { data?: unknown; message?: string }
    | null;
  return { status: res.status(), data: json?.data, message: json?.message };
}

/** Create an article via the admin API (used to fetch the generated slug). */
export async function getArticleSlug(
  request: APIRequestContext,
  id: number,
  token: string
): Promise<string> {
  const { status, data } = await api(request, `/admin/articles/${id}`, token);
  expect(status, "fetch article detail").toBe(200);
  return (data as { slug: string }).slug;
}
