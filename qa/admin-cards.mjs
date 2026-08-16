import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
await setViewport(page, 390, 844);
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
await new Promise((r) => setTimeout(r, 3000));
const m = await evalJs(page, `(() => {
  const cards = Array.from(document.querySelectorAll('.card')).map((c, i) => {
    const r = c.getBoundingClientRect();
    const h3 = c.querySelector('h3');
    const title = (h3 ? h3.textContent : '').slice(0, 30);
    // children widths
    const kids = Array.from(c.children).slice(0, 3).map((k) => {
      const kr = k.getBoundingClientRect();
      return k.tagName + ':' + Math.round(kr.width) + ':' + (k.className || '').slice(0, 30);
    });
    return { i, w: Math.round(r.width), right: Math.round(r.right), title, kids };
  });
  return { cw: document.documentElement.clientWidth, cards };
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
