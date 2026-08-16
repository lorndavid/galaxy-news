// Comprehensive API E2E tests against the live stack.
// Run: node qa/api-tests.mjs
const BASE = "http://localhost:4000/api/v1";

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = "") {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push({ name, detail: String(detail).slice(0, 300) });
    console.log(`  ✗ ${name} ${detail}`);
  }
}

async function req(method, path, { token, body, raw } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

// admin-endpoint request (mounted under /admin)
async function areq(method, path, opts = {}) {
  return req(method, `/admin${path}`, opts);
}

let adminToken, authorToken, editorToken;

// ---------- AUTH ----------
console.log("\n[1] AUTH");
{
  const r = await req("POST", "/auth/login", { body: { email: "admin@navatra.tv", password: "admin123" } });
  check("admin login 200", r.status === 200, r.status);
  adminToken = r.data?.data?.accessToken || r.data?.accessToken || r.data?.data?.token;
  check("admin token issued", !!adminToken);

  const bad = await req("POST", "/auth/login", { body: { email: "admin@navatra.tv", password: "wrongpass123" } });
  check("wrong password rejected", bad.status === 401 || bad.status === 400, bad.status);

  const missing = await req("POST", "/auth/login", { body: {} });
  check("missing fields rejected", missing.status === 400 || missing.status === 422, missing.status);

  const me = await req("GET", "/auth/me", { token: adminToken });
  check("me returns user", me.status === 200 && me.data?.data?.email === "admin@navatra.tv", `${me.status} ${JSON.stringify(me.data).slice(0,120)}`);
}

// find/create author+editor tokens via admin API
let authorId, editorId;
{
  const users = await areq("GET", "/users", { token: adminToken });
  const list = users.data?.data?.items || users.data?.data || [];
  const author = list.find((u) => u.role === "AUTHOR") || list.find((u) => u.role === "EDITOR");
  const editor = list.find((u) => u.role === "EDITOR") || list.find((u) => u.role === "ADMIN");
  if (author) {
    const r = await req("POST", "/auth/login", { body: { email: author.email, password: "author123" } });
    if (r.status !== 200) {
      // try common seeded password
      const r2 = await req("POST", "/auth/login", { body: { email: author.email, password: "password123" } });
      authorToken = r2.data?.data?.accessToken || r2.data?.data?.token;
      check("author login", !!authorToken);
    } else {
      authorToken = r.data?.data?.accessToken || r.data?.data?.token;
      check("author login", !!authorToken);
    }
    authorId = author.id;
  } else {
    check("author user exists (seed)", false, "no AUTHOR in seed");
  }
  if (editor) {
    const r = await req("POST", "/auth/login", { body: { email: editor.email, password: "editor123" } });
    const t = r.data?.data?.accessToken || r.data?.data?.token;
    if (t) editorToken = t;
    editorId = editor.id;
    check("editor login", !!t);
  }
}

// ---------- PUBLIC CONTENT ----------
console.log("\n[2] PUBLIC CONTENT");
{
  const cats = await req("GET", "/categories");
  check("categories 200 + list", cats.status === 200 && Array.isArray(cats.data?.data), `${cats.status}`);

  const arts = await req("GET", "/articles?page=1&pageSize=8");
  check("articles paginated", arts.status === 200 && Array.isArray(arts.data?.data?.items), `${arts.status}`);
  check("articles have items", (arts.data?.data?.items?.length || 0) > 0);

  const latest = await req("GET", "/articles/latest?limit=6");
  check("latest 200", latest.status === 200 && Array.isArray(latest.data?.data), latest.status);

  const featured = await req("GET", "/articles/featured?limit=6");
  check("featured 200", featured.status === 200, featured.status);

  const breaking = await req("GET", "/articles/breaking");
  check("breaking 200", breaking.status === 200, breaking.status);

  const popular = await req("GET", "/articles/popular?limit=5");
  check("popular 200", popular.status === 200, popular.status);

  const search = await req("GET", "/articles?q=AOT");
  check("search works", search.status === 200 && (search.data?.data?.items || []).length > 0, `${search.status}`);

  // article detail
  const first = (arts.data?.data?.items || [])[0];
  if (first) {
    const one = await req("GET", `/articles/${first.slug}`);
    check("article by slug", one.status === 200 && one.data?.data?.slug === first.slug, `${one.status}`);
    const rel = await req("GET", `/articles/${first.slug}/related`);
    check("related articles", rel.status === 200, `${rel.status}`);
  }

  const hs = await req("GET", "/homepage/sections");
  check("homepage sections", hs.status === 200 && Array.isArray(hs.data?.data), `${hs.status}`);

  const nav = await req("GET", "/navigation");
  check("navigation list", nav.status === 200 && Array.isArray(nav.data?.data), `${nav.status}`);

  const settings = await req("GET", "/settings");
  check("settings public", settings.status === 200 && settings.data?.data?.siteName, `${settings.status}`);

  const ads = await req("GET", "/ads/sidebar");
  check("sidebar ads", ads.status === 200, `${ads.status}`);

  const sitemap = await fetch("http://localhost:4000/api/v1/sitemap.xml").then((r) => r.status);
  check("sitemap.xml 200", sitemap === 200, sitemap);
  const robots = await fetch("http://localhost:4000/api/v1/robots.txt").then((r) => r.status);
  check("robots.txt 200", robots === 200, robots);
}

// ---------- ARTICLE CRUD ----------
console.log("\n[3] ARTICLE CRUD");
let articleId, articleSlug;
{
  const cats = await req("GET", "/categories");
  const catId = cats.data?.data?.[0]?.id;

  // validation: missing title
  const bad = await areq("POST", "/articles", { token: adminToken, body: { content: "no title here" } });
  check("create without title rejected", bad.status === 400 || bad.status === 422, bad.status);

  const title = `QA Article ${Date.now()}`;
  const created = await areq("POST", "/articles", {
    token: adminToken,
    body: {
      title,
      excerpt: "QA excerpt",
      content: "<p>QA content body</p>",
      categoryId: catId,
      status: "PUBLISHED",
    },
  });
  check("create article 201", created.status === 201 || created.status === 200, created.status);
  articleId = created.data?.data?.id;
  articleSlug = created.data?.data?.slug;
  check("article has slug (auto)", !!articleSlug, JSON.stringify(created.data?.data).slice(0, 150));

  // appears publicly
  const pub = await req("GET", `/articles/${articleSlug}`);
  check("new article public", pub.status === 200 && pub.data?.data?.title === title, `${pub.status}`);

  // update
  const upd = await areq("PATCH", `/articles/${articleId}`, {
    token: adminToken,
    body: { title: `${title} (updated)` },
  });
  check("update article", upd.status === 200 && upd.data?.data?.title?.includes("updated"), `${upd.status} ${JSON.stringify(upd.data).slice(0,120)}`);

  // author can edit own, not others'
  if (authorToken && articleId) {
    const own = await areq("POST", "/articles", {
      token: authorToken,
      body: { title: `QA Author ${Date.now()}`, content: "author content", categoryId: catId, status: "DRAFT" },
    });
    check("author creates own article", own.status === 201 || own.status === 200, own.status);
    if (own.data?.data?.id) {
      const del = await areq("DELETE", `/articles/${own.data.data.id}`, { token: authorToken });
      check("author deletes own article", del.status === 200 || del.status === 204, del.status);
    }
    const delOther = await areq("DELETE", `/articles/${articleId}`, { token: authorToken });
    check("author cannot delete others' article", delOther.status === 403 || delOther.status === 404, delOther.status);
  }

  // delete (cleanup)
  const del = await areq("DELETE", `/articles/${articleId}`, { token: adminToken });
  check("delete article", del.status === 200 || del.status === 204, del.status);
  const gone = await req("GET", `/articles/${articleSlug}`);
  check("deleted article gone", gone.status === 404 || gone.data?.data === null, gone.status);
}

// ---------- CATEGORY CRUD ----------
console.log("\n[4] CATEGORY CRUD");
let catId;
{
  const name = `QA Cat ${Date.now()}`;
  const created = await areq("POST", "/categories", { token: adminToken, body: { name, description: "qa" } });
  check("create category", created.status === 201 || created.status === 200, created.status);
  catId = created.data?.data?.id;
  check("category slug auto", !!created.data?.data?.slug);

  const upd = await areq("PATCH", `/categories/${catId}`, { token: adminToken, body: { description: "updated desc" } });
  check("update category", upd.status === 200, upd.status);

  const del = await areq("DELETE", `/categories/${catId}`, { token: adminToken });
  check("delete category", del.status === 200 || del.status === 204, del.status);
}

// ---------- TAGS ----------
console.log("\n[5] TAGS");
{
  const name = `qa-tag-${Date.now()}`;
  const created = await areq("POST", "/tags", { token: adminToken, body: { name } });
  check("create tag", created.status === 201 || created.status === 200, created.status);
  const tid = created.data?.data?.id;
  if (tid) {
    const del = await areq("DELETE", `/tags/${tid}`, { token: adminToken });
    check("delete tag", del.status === 200 || del.status === 204, del.status);
  }
}

// ---------- COMMENTS ----------
console.log("\n[6] COMMENTS");
{
  const arts = await req("GET", "/articles?page=1&pageSize=1");
  const a = arts.data?.data?.items?.[0];
  if (a) {
    const sub = await req("POST", "/comments", {
      body: { articleId: a.id, name: "QA User", email: "qa@test.com", content: "QA comment " + Date.now() },
    });
    check("submit comment", sub.status === 201 || sub.status === 200, sub.status);

    const list = await req("GET", `/comments?articleId=${a.id}`);
    check("comments list (query param)", list.status === 200 && Array.isArray(list.data?.data), `${list.status} ${JSON.stringify(list.data).slice(0,100)}`);

    // moderation
    const adminList = await areq("GET", "/comments", { token: adminToken });
    const adminComments = adminList.data?.data?.items || adminList.data?.data || [];
    const pending = adminComments.find((c) => c.content?.startsWith("QA comment"));
    if (pending) {
      const appr = await areq("PATCH", `/comments/${pending.id}`, { token: adminToken, body: { status: "APPROVED" } });
      check("approve comment", appr.status === 200, appr.status);
      const del = await areq("DELETE", `/comments/${pending.id}`, { token: adminToken });
      check("delete comment", del.status === 200 || del.status === 204, del.status);
    }
  }
}

// ---------- ADS ----------
console.log("\n[7] ADS");
{
  // validation: missing fields
  const bad = await areq("POST", "/ads", { token: adminToken, body: { name: "no image" } });
  check("ad without image rejected", bad.status === 400 || bad.status === 422, bad.status);

  const created = await areq("POST", "/ads", {
    token: adminToken,
    body: {
      name: `QA Ad ${Date.now()}`,
      image: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      link: "https://example.com",
      position: "sidebar",
      isActive: true,
    },
  });
  check("create ad", created.status === 201 || created.status === 200, `${created.status} ${JSON.stringify(created.data).slice(0,150)}`);
  const adId = created.data?.data?.id;

  if (adId) {
    // partial update only (isActive) — regression for the fixed validator
    const partial = await areq("PATCH", `/ads/${adId}`, { token: adminToken, body: { isActive: false } });
    check("ad partial update (isActive only)", partial.status === 200, `${partial.status} ${JSON.stringify(partial.data).slice(0,120)}`);

    // expired ad must not appear publicly
    const expired = await areq("POST", "/ads", {
      token: adminToken,
      body: {
        name: `QA Expired ${Date.now()}`,
        image: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
        link: "https://example.com",
        position: "sidebar",
        isActive: true,
        startDate: "2020-01-01T00:00:00.000Z",
        endDate: "2020-02-01T00:00:00.000Z",
      },
    });
    const expId = expired.data?.data?.id;
    const pubAds = await req("GET", "/ads/sidebar");
    const visible = (pubAds.data?.data || []).map((x) => x.id);
    check("expired ad hidden publicly", !visible.includes(expId), JSON.stringify(visible));

    const del = await areq("DELETE", `/ads/${adId}`, { token: adminToken });
    check("delete ad", del.status === 200 || del.status === 204, del.status);
    if (expId) await areq("DELETE", `/ads/${expId}`, { token: adminToken });
  }
}

// ---------- THEME / SETTINGS ----------
console.log("\n[8] THEME / SETTINGS");
{
  const get = await req("GET", "/settings");
  const original = get.data?.data;

  // invalid values rejected
  const badColor = await areq("PUT", "/settings", { token: adminToken, body: { primaryColor: "not-a-color" } });
  check("invalid color rejected", badColor.status === 400 || badColor.status === 422, `${badColor.status} ${JSON.stringify(badColor.data).slice(0,120)}`);

  const badFont = await areq("PUT", "/settings", { token: adminToken, body: { fontBody: "Comic Sans MS" } });
  check("invalid font rejected", badFont.status === 400 || badFont.status === 422, `${badFont.status} ${JSON.stringify(badFont.data).slice(0,120)}`);

  // XSS stripped from siteName
  const xss = await areq("PUT", "/settings", { token: adminToken, body: { siteName: 'Navatra <script>alert(1)</script> TV' } });
  check("XSS siteName sanitized", !(xss.data?.data?.siteName || "").includes("<script>"), JSON.stringify(xss.data).slice(0,120));

  // valid theme update applies (flat fields)
  const upd = await areq("PUT", "/settings", { token: adminToken, body: { primaryColor: "#e11d48" } });
  check("valid theme update", upd.status === 200 && upd.data?.data?.primaryColor === "#e11d48", `${upd.status} ${JSON.stringify(upd.data).slice(0,120)}`);
  const pub = await req("GET", "/settings");
  check("public sees new theme", pub.data?.data?.primaryColor === "#e11d48", JSON.stringify(pub.data?.data?.primaryColor));

  // restore original
  await areq("PUT", "/settings", { token: adminToken, body: { siteName: original?.siteName, primaryColor: original?.primaryColor } });
}

// ---------- HOMEPAGE SECTIONS + NAV ----------
console.log("\n[9] HOMEPAGE + NAVIGATION");
{
  const get = await req("GET", "/homepage/sections");
  const keys = get.data?.data || [];
  const hadVideo = keys.includes("video");
  const toggle = await areq("PUT", "/homepage/sections", {
    token: adminToken,
    body: { sections: [{ key: "video", enabled: !hadVideo }] },
  });
  check("toggle homepage section", toggle.status === 200, `${toggle.status} ${JSON.stringify(toggle.data).slice(0,120)}`);
  const after = await req("GET", "/homepage/sections");
  check("toggle persisted", (after.data?.data || []).includes("video") === !hadVideo, JSON.stringify(after.data?.data));
  // restore
  await areq("PUT", "/homepage/sections", { token: adminToken, body: { sections: [{ key: "video", enabled: hadVideo }] } });

  // nav create + delete (sequence regression)
  const created = await areq("POST", "/navigation", {
    token: adminToken,
    body: { label: `QA Nav ${Date.now()}`, type: "page", value: "news" },
  });
  check("create nav item", created.status === 201 || created.status === 200, `${created.status} ${JSON.stringify(created.data).slice(0,120)}`);
  const nid = created.data?.data?.id;
  if (nid) {
    const del = await areq("DELETE", `/navigation/${nid}`, { token: adminToken });
    check("delete nav item", del.status === 200 || del.status === 204, del.status);
  }
}

// ---------- RBAC ----------
console.log("\n[10] RBAC");
{
  const asAuthor = await areq("GET", "/users", { token: authorToken });
  check("author cannot list users", asAuthor.status === 403, `${asAuthor.status}`);

  const asEditor = await areq("GET", "/users", { token: editorToken });
  check("editor cannot list users", asEditor.status === 403, `${asEditor.status}`);

  const noToken = await areq("GET", "/articles?status=DRAFT");
  const noToken2 = await areq("GET", "/users");
  check("no token -> protected 401", noToken.status === 401 || noToken.status === 403, `${noToken.status}`);
  check("no token -> users 401", noToken2.status === 401 || noToken2.status === 403, `${noToken2.status}`);

  const bogus = await req("GET", "/auth/me", { token: "bogus.token.here" });
  check("invalid token rejected", bogus.status === 401, `${bogus.status}`);
}

// ---------- RATE LIMIT ----------
console.log("\n[11] RATE LIMIT (auth)");
{
  let got429 = false;
  for (let i = 0; i < 16; i++) {
    const r = await req("POST", "/auth/login", { body: { email: `x${i}@test.com`, password: "wrong" } });
    if (r.status === 429) { got429 = true; break; }
  }
  check("auth rate limit 429", got429, "no 429 after 16 attempts");
}

console.log(`\n========== RESULT: ${passed} passed, ${failed} failed ==========`);
if (failures.length) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
}
process.exit(failed ? 1 : 0);
