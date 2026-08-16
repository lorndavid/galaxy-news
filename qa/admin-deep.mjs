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
  const cards = Array.from(document.querySelectorAll('.card'));
  const act = cards.find((c) => c.textContent.includes('សកម្មភាពថ្មីៗ'));
  const li = act ? act.querySelector('li') : null;
  if (!li) return { noLi: true };
  const inner = li.querySelector('.min-w-0');
  const p = li.querySelector('p');
  const grid = act.closest('.grid');
  const out = {
    cardW: Math.round(act.getBoundingClientRect().width),
    liW: Math.round(li.getBoundingClientRect().width),
    innerW: inner ? Math.round(inner.getBoundingClientRect().width) : null,
    pW: p ? Math.round(p.getBoundingClientRect().width) : null,
    pScroll: p ? p.scrollWidth : null,
    pMinW: p ? getComputedStyle(p).minWidth : null,
    pWrap: p ? getComputedStyle(p).overflowWrap : null,
    pWordBreak: p ? getComputedStyle(p).wordBreak : null,
    liMinW: getComputedStyle(li).minWidth,
    innerMinW: inner ? getComputedStyle(inner).minWidth : null,
    gridCols: grid ? getComputedStyle(grid).gridTemplateColumns : null,
    gridW: grid ? Math.round(grid.getBoundingClientRect().width) : null,
    text: p ? p.textContent.slice(0, 50) : null,
  };
  return out;
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
