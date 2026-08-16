import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
await setViewport(page, 1440);
await nav(page, "http://localhost:3000/");
const m = await evalJs(page, `(() => {
  const cards = Array.from(document.querySelectorAll('.whats-news-caption .single-what-news')).slice(0, 2);
  return cards.map((c) => {
    const img = c.querySelector('.what-img');
    const cap = c.querySelector('.what-cap');
    const cs = getComputedStyle(cap);
    return {
      cardBottom: Math.round(c.getBoundingClientRect().bottom),
      imgBottom: Math.round(img.getBoundingClientRect().bottom),
      capTop: Math.round(cap.getBoundingClientRect().top),
      capPos: cs.position,
      capBottom: cs.bottom,
      capH: Math.round(cap.getBoundingClientRect().height),
      marginBottom: getComputedStyle(c).marginBottom,
    };
  });
})()`);
console.log(JSON.stringify(m, null, 1));
browser.close();
process.exit(0);
