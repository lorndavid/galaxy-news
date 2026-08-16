// Visit every admin route at mobile + desktop, report page overflow.
import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");

const ROUTES = ["/", "/articles", "/articles/new", "/categories", "/tags", "/media", "/users", "/ads", "/homepage-builder", "/navigation-builder", "/settings", "/comments", "/messages", "/newsletter", "/activity", "/profile", "/login"];

// login first
await setViewport(page, 1280);
await nav(page, "http://localhost:3001/login");
await new Promise((r) => setTimeout(r, 2000));
await evalJs(page, `(() => {
  const inputs = document.querySelectorAll('input');
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(inputs[0], 'admin@navatra.tv'); inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  set.call(inputs[1], 'admin123'); inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);
await new Promise((r) => setTimeout(r, 300));
await evalJs(page, `(() => { const b = document.querySelector('button[type="submit"], form button') || document.querySelector('button'); if (b) b.click(); return !!b; })()`);
await new Promise((r) => setTimeout(r, 2500));

const results = [];
for (const w of [390, 768, 1440]) {
  await setViewport(page, w, 900);
  for (const route of ROUTES) {
    await nav(page, `http://localhost:3001${route}`);
    await new Promise((r) => setTimeout(r, 1800));
    const m = await evalJs(page, `(() => {
      const de = document.documentElement;
      return {
        overflow: de.scrollWidth - de.clientWidth,
        url: location.pathname,
        hasContent: document.body.textContent.trim().length > 50,
      };
    })()`);
    results.push({ vp: w, route, overflow: m.overflow, url: m.url, content: m.hasContent });
  }
}

let bad = 0;
for (const r of results) {
  const flag = r.overflow > 0 ? "  <-- OVERFLOW" : "";
  if (r.overflow > 0) bad++;
  console.log(`${r.vp}px ${r.route.padEnd(18)} overflow=${r.overflow}${flag} ${r.url !== r.route ? "(redirect->" + r.url + ")" : ""}`);
}
console.log(`\nTOTAL routes with overflow: ${bad}`);
browser.close();
process.exit(bad ? 1 : 0);
