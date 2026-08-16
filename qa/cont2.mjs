import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
for (const w of [1280, 1440, 1920]) {
  await setViewport(page, w);
  await nav(page, "http://localhost:3000/");
  const info = await evalJs(page, `(() => {
    const out = [];
    document.querySelectorAll('.container').forEach((el) => {
      const w = Math.round(el.getBoundingClientRect().width);
      const cs = getComputedStyle(el);
      out.push(w + 'px max=' + cs.maxWidth + ' :: ' + (el.className||'').slice(0,40));
    });
    return out.slice(0, 12);
  })()`);
  console.log("VP", w, JSON.stringify(info));
}
browser.close();
process.exit(0);
