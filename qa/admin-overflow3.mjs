import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
await setViewport(page, 390, 844);
await nav(page, "http://localhost:3001/login");
await new Promise((r) => setTimeout(r, 2000));
// login
await evalJs(page, `(() => {
  const inputs = document.querySelectorAll('input');
  const email = inputs[0], pass = inputs[1];
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(email, 'admin@navatra.tv'); email.dispatchEvent(new Event('input', { bubbles: true }));
  set.call(pass, 'admin123'); pass.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);
await new Promise((r) => setTimeout(r, 400));
await evalJs(page, `(() => { const btn = document.querySelector('button[type="submit"], form button') || document.querySelector('button'); if (btn) btn.click(); return !!btn; })()`);
await new Promise((r) => setTimeout(r, 3000));
const m = await evalJs(page, `(() => {
  const de = document.documentElement;
  const ow = de.scrollWidth - de.clientWidth;
  const wide = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > de.clientWidth + 1) {
      const tag = el.tagName.toLowerCase();
      const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 70) : '';
      wide.push({ tag, cls, right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width) });
    }
  });
  const seen = {};
  const uniq = wide.filter((o) => { const k = o.tag + '.' + o.cls; if (seen[k]) return false; seen[k] = true; return true; });
  return { url: location.pathname, overflow: ow, count: wide.length, uniq: uniq.slice(0, 12) };
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
