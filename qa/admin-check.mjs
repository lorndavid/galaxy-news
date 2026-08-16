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
  const li = document.querySelector('.card li');
  if (!li) return { noLi: true };
  const p = li.querySelector('p');
  const inner = li.querySelector('.min-w-0');
  return {
    liW: Math.round(li.getBoundingClientRect().width),
    pClass: p ? p.className : null,
    pW: p ? Math.round(p.getBoundingClientRect().width) : null,
    innerW: inner ? Math.round(inner.getBoundingClientRect().width) : null,
    innerClass: inner ? inner.className : null,
    pOverflow: p ? p.scrollWidth - p.clientWidth : null,
    liMinContent: li.scrollWidth,
    text: p ? p.textContent.slice(0, 40) : null,
    gridItem: (function(){ const c = li.closest('.grid'); return c ? getComputedStyle(c).gridTemplateColumns : null; })(),
  };
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
