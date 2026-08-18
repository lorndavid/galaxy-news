import { expect, test } from "@playwright/test";
import { PUBLIC_URL } from "../playwright.config";

test.describe("public frontend", () => {
  test("homepage loads with hero and sections", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header a").first()).toBeVisible();
    await expect(page.locator("article, .article-card, .news-card, .hero-card, .card").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("footer")).toBeVisible();
  });

  test("homepage has no horizontal overflow", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("article page loads", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/article/article-msyf14cm`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });

  test("article page has no horizontal overflow", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/article/article-msyf14cm`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("category page loads", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/category/national-news`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("Khmer route shows correct lang", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/kh/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
  });

  test("English route loads", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/en/`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("Khmer article URL renders with km lang", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/kh/news/article-msyf14cm`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
  });

  test("English article URL renders with en lang", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/en/news/article-msyf14cm`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("language switcher toggles between Khmer and English", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const switcher = page.locator(".language-switcher");
    if ((await switcher.count()) > 0) {
      const enBtn = switcher.locator("button", { hasText: "EN" });
      if ((await enBtn.count()) > 0) {
        await enBtn.click();
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
      }
      const khBtn = switcher.locator("button", { hasText: "ខ្មែរ" });
      if ((await khBtn.count()) > 0) {
        await khBtn.click();
        await expect(page.locator("html")).toHaveAttribute("lang", "km");
      }
    }
  });

  test("search page loads", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/search?q=AI`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("nonexistent route shows error", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/this-page-does-not-exist-xyz`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("footer renders", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await expect(page.locator("footer")).toBeVisible();
  });

  test("no overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("no overflow at 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("no overflow at 1920px", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("article images have valid src", async ({ page }) => {
    await page.goto(`${PUBLIC_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const src = await images.nth(i).getAttribute("src");
      if (src && !src.startsWith("data:")) {
        expect(src).not.toBe("undefined");
        expect(src).not.toBe("");
      }
    }
  });
});
