import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
await setViewport(page, 1440);
await nav(page, "http://localhost:3000/");
await new Promise((r) => setTimeout(r, 2500));
const m = await evalJs(page, `(() => {
  const cards = Array.from(document.querySelectorAll('.single-what-news')).slice(0, 3);
  const out = cards.map((c) => {
    const img = c.querySelector('.what-img');
    const cap = c.querySelector('.what-cap');
    const cs = getComputedStyle(cap);
    return {
      cls: (c.className||'').slice(0,50),
      cardBottom: Math.round(c.getBoundingClientRect().bottom),
      imgBottom: img ? Math.round(img.getBoundingClientRect().bottom) : null,
      capTop: cap ? Math.round(cap.getBoundingClientRect().top) : null,
      capPos: cs.position,
      capBottom: cs.bottom,
      marginBottom: getComputedStyle(c).marginBottom,
    };
  });
  const caps = Array.from(document.querySelectorAll('.what-cap')).slice(0, 4).map((x) => ({ cls: (x.className||''), pos: getComputedStyle(x).position, bottom: getComputedStyle(x).bottom }));
  return { cards: out, caps };
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
