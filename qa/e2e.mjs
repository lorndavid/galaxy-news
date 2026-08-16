// Browser E2E: public journeys + admin flows + responsive + console audit.
import { launchChrome, connect, newPage, nav, evalJs, setViewport, shot } from "./cdp.mjs";

const SITE = "http://localhost:3000";
const ADMIN = "http://localhost:3001";
const API = "http://localhost:4000/api/v1";

let passed = 0;
let failed = 0;
const failures = [];
function check(name, cond, detail = "") {
  if (cond) passed++;
  else {
    failed++;
    failures.push({ name, detail: String(detail).slice(0, 300) });
    console.log(`  ✗ ${name} ${detail}`);
  }
}

const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");

// collect console errors during the whole run
const consoleErrs = [];
page.onEvent((msg) => {
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200);
    consoleErrs.push(`${msg.params.type}: ${text}`);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleErrs.push("EXC: " + (msg.params.exceptionDetails?.exception?.description || "").slice(0, 200));
  }
  if (msg.method === "Network.responseReceived" && msg.params.response.status >= 500) {
    consoleErrs.push(`HTTP ${msg.params.response.status}: ${msg.params.response.url.slice(0, 100)}`);
  }
});

// ---------- [1] PUBLIC HOMEPAGE ----------
console.log("\n[1] HOMEPAGE");
await nav(page, `${SITE}/`);
await new Promise((r) => setTimeout(r, 2500));
{
  const m = await evalJs(page, `(() => ({
    title: document.title,
    hasHero: !!document.querySelector('.trend-top-img'),
    heroTitle: (document.querySelector('.trend-top-cap h1')||{}).textContent || null,
    sectionCount: document.querySelectorAll('.section-tittle h3').length,
    navItems: Array.from(document.querySelectorAll('.main-menu #navigation > li > a')).map(a=>a.textContent.trim()),
    hasTicker: !!document.querySelector('.breaking-ticker'),
    hasAd: !!document.querySelector('.ad-slot'),
    hasFooter: !!document.querySelector('footer, .footer-area'),
    h1Count: document.querySelectorAll('h1').length,
  }))()`);
  check("homepage title", (m.title || "").includes("Navatra"), m.title);
  check("hero renders", !!m.hasHero && !!m.heroTitle, JSON.stringify(m));
  check("hero has text", (m.heroTitle || "").length > 10, m.heroTitle);
  check("sections present", m.sectionCount >= 4, `sections=${m.sectionCount}`);
  check("nav from builder", m.navItems.length >= 4, JSON.stringify(m.navItems));
  check("ticker present", !!m.hasTicker);
  check("ad slot present", !!m.hasAd);
  check("footer present", !!m.hasFooter);
}

// ---------- [2] CATEGORY + ARTICLE + SEARCH ----------
console.log("\n[2] NAVIGATION FLOWS");
{
  const catLink = await evalJs(page, `(() => {
    const a = document.querySelector('a[href^="/category/"]');
    return a ? a.getAttribute('href') : null;
  })()`);
  if (catLink) {
    await nav(page, `${SITE}${catLink}`);
    await new Promise((r) => setTimeout(r, 2000));
    const m = await evalJs(page, `(() => ({
      h1: (document.querySelector('h1')||{}).textContent || '',
      hasCards: document.querySelectorAll('.single-what-news, .trend-bottom-img, .trend-top-img').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))()`);
    check("category page h1", (m.h1 || "").length > 0, m.h1);
    check("category has articles", m.hasCards > 0, `cards=${m.hasCards}`);
    check("category no overflow", m.overflow <= 0, `overflow=${m.overflow}`);
  } else {
    check("category link found", false, "no /category/ link on homepage");
  }

  // article
  const artLink = await evalJs(page, `(() => {
    const a = document.querySelector('a[href^="/article/"]');
    return a ? a.getAttribute('href') : null;
  })()`);
  if (artLink) {
    await nav(page, `${SITE}${artLink}`);
    await new Promise((r) => setTimeout(r, 2500));
    const m = await evalJs(page, `(() => {
      const content = document.querySelector('.news-content');
      return {
        h1: (document.querySelector('.news-title')||{}).textContent || '',
        hasContent: !!content && content.textContent.length > 50,
        hasMeta: !!document.querySelector('.news-meta'),
        hasShare: !!document.querySelector('.news-social'),
        hasComments: !!document.querySelector('.news-comments'),
        hasRelated: !!document.querySelector('.news-related'),
        hasBreadcrumb: !!document.querySelector('.news-breadcrumb'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        jsonLd: !!document.querySelector('script[type="application/ld+json"]'),
        ogImage: !!document.querySelector('meta[property="og:image"]'),
      };
    })()`);
    check("article title", (m.h1 || "").length > 10, m.h1);
    check("article content", !!m.hasContent);
    check("article meta", !!m.hasMeta);
    check("share buttons", !!m.hasShare);
    check("comments section", !!m.hasComments);
    check("related articles", !!m.hasRelated);
    check("breadcrumb", !!m.hasBreadcrumb);
    check("article no overflow", m.overflow <= 0, `overflow=${m.overflow}`);
    check("article JSON-LD", !!m.jsonLd);
    check("article OG image", !!m.ogImage);
  } else {
    check("article link found", false, "no /article/ link");
  }

  // search
  await nav(page, `${SITE}/search?q=AOT`);
  await new Promise((r) => setTimeout(r, 2000));
  const s = await evalJs(page, `(() => ({
    results: document.querySelectorAll('a[href^="/article/"]').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))()`);
  check("search results", s.results > 0, `results=${s.results}`);
  check("search no overflow", s.overflow <= 0, `overflow=${s.overflow}`);

  // 404
  await nav(page, `${SITE}/definitely-not-a-real-page-xyz`);
  await new Promise((r) => setTimeout(r, 1200));
  const nf = await evalJs(page, `document.body.textContent.includes('404') || document.body.textContent.includes('មិនមាន') || document.querySelector('h1')?.textContent.includes('404')`);
  check("404 page", !!nf);

  // author page
  const authLink = await evalJs(page, `(() => {
    const a = document.querySelector('a[href^="/author/"]');
    return a ? a.getAttribute('href') : null;
  })()`);
  if (authLink) {
    await nav(page, `${SITE}${authLink}`);
    await new Promise((r) => setTimeout(r, 2000));
    const ah = await evalJs(page, `(document.querySelector('h1')||{}).textContent || ''`);
    check("author page renders", (ah || "").length > 0, ah);
  }
}

// ---------- [3] ADMIN FLOWS ----------
console.log("\n[3] ADMIN");
async function adminFetch(path, opts = {}) {
  const full = path.startsWith("/auth") ? path : `/admin${path}`;
  const { headers = {}, ...rest } = opts;
  const res = await fetch(`${API}${full}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _status: res.status, _body: text.slice(0, 200) };
  }
}
let adminToken;
{
  const r = await adminFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@navatra.tv", password: "admin123" }),
  });
  adminToken = r.data?.data?.accessToken || r.data?.data?.token || r.data?.accessToken || r.data?.token;
  check("admin API token", !!adminToken, JSON.stringify(r).slice(0, 120));
}

// login page loads
await nav(page, `${ADMIN}/login`);
await new Promise((r) => setTimeout(r, 2000));
{
  const url = await evalJs(page, "location.pathname");
  const hasForm = await evalJs(page, `!!document.querySelector('input[type="password"], form')`);
  // if already authed it redirects to dashboard — either is acceptable
  check("admin login route reachable", hasForm || url !== "/login", `${url} form=${hasForm}`);
}

// fill in the login form and submit
{
  const loginUrl = await evalJs(page, "location.pathname");
  if (loginUrl === "/login") {
    const filled = await evalJs(page, `(() => {
      const inputs = document.querySelectorAll('input');
      const email = inputs[0], pass = inputs[1];
      if (!email || !pass) return false;
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(email, 'admin@navatra.tv'); email.dispatchEvent(new Event('input', { bubbles: true }));
      set.call(pass, 'admin123'); pass.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    check("login form fields found", !!filled);
    await new Promise((r) => setTimeout(r, 300));
    await evalJs(page, `(() => {
      const btn = document.querySelector('button[type="submit"], form button') || document.querySelector('button');
      if (btn) btn.click();
      return !!btn;
    })()`);
    await new Promise((r) => setTimeout(r, 2500));
  }
}

// dashboard
await nav(page, `${ADMIN}/`);
await new Promise((r) => setTimeout(r, 3000));
{
  const m = await evalJs(page, `(() => ({
    url: location.pathname,
    hasSidebar: !!document.querySelector('aside, .sidebar, nav'),
    hasStats: document.body.textContent.includes('អត្ថបទ') || document.body.textContent.includes('Articles') || document.body.textContent.includes('Dashboard'),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))()`);
  check("admin dashboard renders", m.hasSidebar && m.hasStats, JSON.stringify(m));
  check("admin dashboard no overflow", m.overflow <= 0, `overflow=${m.overflow}`);
}

// theme change -> public reflects
console.log("\n[4] THEME E2E");
{
  const original = await adminFetch("/settings", { headers: { Authorization: `Bearer ${adminToken}` } });
  const origColor = original.data?.primaryColor;
  await adminFetch("/settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ primaryColor: "#7c3aed" }),
  });
  await nav(page, `${SITE}/`);
  await new Promise((r) => setTimeout(r, 2000));
  const cssVar = await evalJs(page, `getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()`);
  check("theme color applied live", cssVar === "#7c3aed", `cssVar=${cssVar}`);
  // restore
  await adminFetch("/settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ primaryColor: origColor || "#0d3fa9" }),
  });
}

// homepage section toggle -> public reflects
console.log("\n[5] HOMEPAGE BUILDER E2E");
{
  const get = await adminFetch("/homepage/sections", { headers: { Authorization: `Bearer ${adminToken}` } });
  const keys = get.data || [];
  const hadVideo = keys.includes("video");
  await adminFetch("/homepage/sections", {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ sections: [{ key: "video", enabled: !hadVideo }] }),
  });
  await nav(page, `${SITE}/`);
  await new Promise((r) => setTimeout(r, 2000));
  const hasVideo = await evalJs(page, `!!document.querySelector('.youtube-area')`);
  check("section toggle reflects on public", hasVideo === !hadVideo, `hasVideo=${hasVideo} expected=${!hadVideo}`);
  // restore
  await adminFetch("/homepage/sections", {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ sections: [{ key: "video", enabled: hadVideo }] }),
  });
}

// navigation builder -> public reflects
console.log("\n[6] NAVIGATION E2E");
{
  const created = await adminFetch("/navigation", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ label: "QA Test Link", type: "page", value: "about" }),
  });
  const navId = created.data?.id;
  check("admin creates nav item", !!navId, JSON.stringify(created).slice(0, 150));
  if (navId) {
    await nav(page, `${SITE}/`);
    await new Promise((r) => setTimeout(r, 2000));
    const hasQa = await evalJs(page, `Array.from(document.querySelectorAll('#navigation > li > a')).some(a => a.textContent.trim() === 'QA Test Link')`);
    check("nav item on public site", !!hasQa);
    await adminFetch(`/navigation/${navId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
}

// article CRUD end-to-end: create -> public -> delete
console.log("\n[7] ARTICLE CRUD E2E");
{
  const cats = await adminFetch("/categories", { headers: { Authorization: `Bearer ${adminToken}` } });
  const catId = cats.data?.items?.[0]?.id || cats.data?.[0]?.id;
  const title = `E2E Article ${Date.now()}`;
  const created = await adminFetch("/articles", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title,
      excerpt: "E2E excerpt",
      content: "<p>E2E content body with enough text to render properly.</p>",
      categoryId: catId,
      status: "PUBLISHED",
    }),
  });
  const slug = created.data?.slug;
  check("article created via API", !!slug, JSON.stringify(created).slice(0, 150));
  if (slug) {
    await nav(page, `${SITE}/article/${slug}`);
    await new Promise((r) => setTimeout(r, 2500));
    const shown = await evalJs(page, `(document.querySelector('.news-title')||{}).textContent || ''`);
    check("article visible publicly", shown === title, `shown=${shown.slice(0,50)}`);
    await adminFetch(`/articles/${created.data.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await nav(page, `${SITE}/article/${slug}`);
    await new Promise((r) => setTimeout(r, 1500));
    const gone = await evalJs(page, `document.body.textContent.includes('មិនអាច') || document.body.textContent.includes('Not Found') || !document.querySelector('.news-title')`);
    check("deleted article gone publicly", !!gone);
  }
}

// ---------- [8] RESPONSIVE ----------
console.log("\n[8] RESPONSIVE");
const VIEWPORTS = [320, 375, 390, 414, 768, 834, 1024, 1280, 1440, 1920];
for (const w of VIEWPORTS) {
  await setViewport(page, w);
  await nav(page, `${SITE}/`);
  await new Promise((r) => setTimeout(r, 1800));
  const m = await evalJs(page, `(() => {
    const ow = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return { overflow: ow - cw, hero: (document.querySelector('.trend-top-cap h1')||{}).textContent ? 1 : 0 };
  })()`);
  check(`homepage ${w}px no overflow`, m.overflow <= 0, `overflow=${m.overflow}`);
  check(`homepage ${w}px hero visible`, m.hero === 1);
}

// admin at mobile
await setViewport(page, 390);
await nav(page, `${ADMIN}/`);
await new Promise((r) => setTimeout(r, 2500));
{
  const m = await evalJs(page, `(() => {
    const ow = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return { overflow: ow - cw, url: location.pathname };
  })()`);
  check("admin mobile no overflow", m.overflow <= 0, `overflow=${m.overflow} url=${m.url}`);
}

// article responsive
const artLink2 = await evalJs(page, `(() => { const a = document.querySelector('a[href^="/article/"]'); return a ? a.getAttribute('href') : null; })()`);
if (!artLink2) {
  await nav(page, `${SITE}/`);
  await new Promise((r) => setTimeout(r, 2000));
}
const artLink3 = await evalJs(page, `(() => { const a = document.querySelector('a[href^="/article/"]'); return a ? a.getAttribute('href') : null; })()`);
if (artLink3) {
  for (const w of [320, 390, 768, 1440]) {
    await setViewport(page, w);
    await nav(page, `${SITE}${artLink3}`);
    await new Promise((r) => setTimeout(r, 1800));
    const m = await evalJs(page, `document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    check(`article ${w}px no overflow`, m <= 0, `overflow=${m}`);
  }
}

// ---------- [9] CONSOLE ----------
console.log("\n[9] CONSOLE AUDIT");
const realErrs = consoleErrs.filter((e) => !e.includes("favicon") && !e.includes("ERR_CONNECTION"));
check("no console errors", realErrs.length === 0, JSON.stringify(realErrs.slice(0, 5)));

console.log(`\n========== E2E RESULT: ${passed} passed, ${failed} failed ==========`);
if (failures.length) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
}
browser.close();
process.exit(failed ? 1 : 0);
