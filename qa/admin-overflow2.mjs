import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
for (const w of [390, 768, 1024]) {
  await setViewport(page, w, 844);
  await nav(page, "http://localhost:3001/");
  await new Promise((r) => setTimeout(r, 3500));
  const m = await evalJs(page, `(() => {
    const de = document.documentElement;
    const ow = de.scrollWidth - de.clientWidth;
    // find elements with scrollWidth > clientWidth (internal overflow sources)
    const wide = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '';
        wide.push(tag + '.' + cls + ' sw=' + el.scrollWidth + ' cw=' + el.clientWidth);
      }
    });
    return { vp: ${w}, overflow: ow, wide: wide.slice(0, 10), url: location.pathname };
  })()`);
  console.log(JSON.stringify(m));
}
browser.close();
process.exit(0);
