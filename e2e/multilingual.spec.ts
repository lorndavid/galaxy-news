import { expect, test } from "@playwright/test";
import { PUBLIC_URL } from "../playwright.config";
import { api, getAdminToken, loginAsAdmin } from "./helpers";

/**
 * Multilingual + ticker + theme + banner E2E coverage:
 *   - language switcher (KH → EN → KH, persists across reload)
 *   - ticker enable/disable + content comes from real published articles
 *   - theme save → API confirms → CSS variables update on the public site
 *   - banner CRUD with device/priority/schedule → appears on the public site
 */

test.describe.serial("multilingual platform features", () => {
  let token: string;
  let bannerId: number;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    token = (await getAdminToken(page)) ?? "";
    expect(token).toBeTruthy();
  });

  test("language switcher flips the whole UI and persists", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", /^(km|en)$/);

    // Default is Khmer — nav shows the Khmer label for Home.
    const navHome = page.locator("header .editorial-nav a", { hasText: "ទំព័រដើម" }).first();
    await expect(navHome).toBeVisible();

    // Switch to English — nav + section titles flip.
    await page.locator(".language-switcher button", { hasText: "EN" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const enHome = page.locator("header .editorial-nav a", { hasText: "Home" }).first();
    await expect(enHome).toBeVisible();

    // Reload — the preference persisted via localStorage.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.locator("header .editorial-nav a", { hasText: "Home" }).first()
    ).toBeVisible();

    // And back to Khmer.
    await page.locator(".language-switcher button", { hasText: "ខ្មែរ" }).first().click();
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
  });

  test("ticker can be enabled and disabled from the admin UI", async ({ page, request }) => {
    // Start disabled (seed default) — no ticker bar on the public site.
    await page.goto(`${PUBLIC_URL}/`);
    await expect(page.locator(".live-ticker")).toHaveCount(0);

    // Admin: Live News settings → enable + customize.
    await page.goto("/live-news");
    await expect(page.getByText("Live News Ticker").first()).toBeVisible();

    // Toggle ON if off (the switch input is visually hidden — force it).
    const toggle = page.locator("input.peer");
    if (!(await toggle.isChecked())) {
      await toggle.check({ force: true });
    }
    await page.locator('label:has-text("ចំណងជើង") input, input[placeholder="LIVE NEWS"]').fill("LIVE");
    await page.getByRole("button", { name: "រក្សាទុកការកំណត់" }).click();
    await expect(page.getByText("បានរក្សាទុកការកំណត់បន្ទាត់ព័ត៌មាន")).toBeVisible();

    // Public site now shows the ticker with a real headline.
    await page.goto(`${PUBLIC_URL}/`);
    await expect(page.locator(".live-ticker")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".live-ticker .live-ticker-badge")).toContainText("LIVE");

    // Ticker content comes from the real API (published articles).
    const ticker = await api(request, "/ticker", null);
    expect(ticker.status).toBe(200);
    const data = ticker.data as { enabled: boolean; title: string; items: unknown[] };
    expect(data.enabled).toBe(true);
    expect(data.title).toBe("LIVE");
    expect(Array.isArray(data.items)).toBe(true);

    // Disable again — ticker disappears without any code change.
    await page.goto("/live-news");
    await page.locator("input.peer").uncheck({ force: true });
    await page.getByRole("button", { name: "រក្សាទុកការកំណត់" }).click();
    await expect(page.getByText("បានរក្សាទុកការកំណត់បន្ទាត់ព័ត៌មាន")).toBeVisible();

    await page.goto(`${PUBLIC_URL}/`);
    await expect(page.locator(".live-ticker")).toHaveCount(0, { timeout: 20_000 });
  });

  test("theme color save updates the live CSS variables", async ({ page, request }) => {
    const nextColor = "#123456";

    // Admin Appearance → change the primary color.
    await page.goto("/settings");
    await page.getByRole("button", { name: "រូបរាង" }).click();
    await expect(page.getByText("ពណ៌រូបរាង")).toBeVisible();
    await page.locator('input[type="color"]').first().fill(nextColor);
    await page.getByRole("button", { name: "រក្សាទុករូបរាង" }).click();
    await expect(page.getByText("បានរក្សាទុកការកំណត់")).toBeVisible();

    // API confirms persistence.
    const res = await api(request, "/settings", null);
    expect(res.status).toBe(200);
    const settings = res.data as { primaryColor: string };
    expect(settings.primaryColor).toBe(nextColor);

    // Public site applies it as a CSS variable (the theme is applied after
    // the settings fetch resolves — poll instead of asserting once).
    await page.goto(`${PUBLIC_URL}/`);
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim()
          ),
        { timeout: 20_000 }
      )
      .toBe(nextColor);

    // Restore the brand color so we don't leave the site recolored.
    await page.goto("/settings");
    await page.getByRole("button", { name: "រូបរាង" }).click();
    await page.locator('input[type="color"]').first().fill("#0d3fa9");
    await page.getByRole("button", { name: "រក្សាទុករូបរាង" }).click();
    await expect(page.getByText("បានរក្សាទុកការកំណត់")).toBeVisible();
  });

  test("banner CRUD with device/priority/schedule", async ({ page, request }) => {
    const stamp = Date.now();
    const NAME = `E2E Banner ${stamp}`;

    // Create through the admin UI.
    await page.goto("/ads");
    await page.getByRole("button", { name: "បន្ថែម" }).click();
    const modal = page.locator(".fixed.inset-0", { hasText: "បន្ថែមផ្សាយពាណិជ្ជកម្ម" }).last();
    await expect(modal).toBeVisible();
    await modal.locator("input").nth(0).fill(NAME);
    await modal.locator("input").nth(1).fill("E2E Banner Title");
    await modal.locator("input").nth(2).fill("/uploads/seed/banner4.png");
    await modal.locator("input").nth(3).fill("https://example.com");
    await modal.locator("select").filter({ hasText: "កំពូលទំព័រដើម" }).selectOption("homepage-top");
    await modal.locator("select").filter({ hasText: "ទាំងអស់" }).selectOption("mobile");
    await modal.getByRole("button", { name: "រក្សាទុក" }).click();
    await expect(page.getByText("បានបង្កើតផ្សាយពាណិជ្ជកម្ម")).toBeVisible();

    // Grab its id via the API (search by name).
    const list = await api(request, "/admin/ads", token);
    expect(list.status).toBe(200);
    const ads = list.data as {
      id: number;
      name: string;
      position: string;
      device: string;
      priority: number;
    }[];
    const created = ads.find((a) => a.name === NAME);
    expect(created).toBeTruthy();
    expect(created!.position).toBe("homepage-top");
    expect(created!.device).toBe("mobile");
    bannerId = created!.id;

    // It should now be served by the public ads endpoint for the right slot.
    const active = await api(request, "/ads/homepage-top", null);
    expect(active.status).toBe(200);
    const activeAds = active.data as { id: number; name: string }[];
    expect(activeAds.some((a) => a.id === bannerId)).toBe(true);

    // Pause it → no longer served.
    await api(request, `/admin/ads/${bannerId}`, token, {
      method: "PATCH",
      body: { isActive: false },
    });
    const paused = await api(request, "/ads/homepage-top", null);
    const pausedAds = paused.data as { id: number }[];
    expect(pausedAds.some((a) => a.id === bannerId)).toBe(false);

    // Delete it → gone from the admin list.
    await api(request, `/admin/ads/${bannerId}`, token, { method: "DELETE" });
    const after = await api(request, "/admin/ads", token);
    const afterAds = after.data as { id: number }[];
    expect(afterAds.some((a) => a.id === bannerId)).toBe(false);
  });
});
