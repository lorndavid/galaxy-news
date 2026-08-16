import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
await setViewport(page, 1440);
await nav(page, "http://localhost:3000/");
await new Promise((r) => setTimeout(r, 3000));
const m = await evalJs(page, `(() => {
  const sec = document.querySelector('.whats-news-area');
  if (!sec) return { noSection: true };
  const html = sec.innerHTML;
  return {
    len: html.length,
    hasCards: html.includes('single-what-news'),
    hasCap: html.includes('what-cap'),
    hasTabs: html.includes('nav-tabs'),
    tabText: Array.from(sec.querySelectorAll('.nav-link')).map(a => a.textContent.trim()).slice(0, 8),
    first200: html.slice(0, 400),
  };
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
