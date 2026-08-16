import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
await setViewport(page, 390, 844);
await nav(page, "http://localhost:3001/");
await new Promise((r) => setTimeout(r, 3000));
const m = await evalJs(page, `(() => {
  const cw = document.documentElement.clientWidth;
  const offenders = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > cw + 1 || r.left < -1) {
      const tag = el.tagName.toLowerCase();
      const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 70) : '';
      offenders.push({ tag, cls, right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width) });
    }
  });
  // dedupe by class
  const seen = {};
  const uniq = offenders.filter((o) => {
    const k = o.tag + '.' + o.cls;
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
  return { cw, count: offenders.length, uniq: uniq.slice(0, 12) };
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
