import { launchChrome, connect, newPage, nav, evalJs } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
await nav(page, "http://localhost:3000/");
const info = await evalJs(page, `(() => {
  const el = document.querySelector('.container');
  if (!el) return { none: true };
  const cs = getComputedStyle(el);
  // find which stylesheets contain .container rules affecting max-width
  let rules = [];
  for (const sheet of document.styleSheets) {
    let href = sheet.href || '';
    try {
      for (const rule of sheet.cssRules || []) {
        if (rule.media && rule.media.mediaText) {
          for (const r of rule.cssRules || []) {
            if (r.selectorText && r.selectorText.includes('.container') && r.style && r.style.maxWidth) {
              rules.push(href.split('/').pop() + ' | ' + rule.media.mediaText + ' | ' + r.selectorText + ' | ' + r.style.maxWidth);
            }
          }
        } else if (rule.selectorText && rule.selectorText.includes('.container') && rule.style && rule.style.maxWidth) {
          rules.push(href.split('/').pop() + ' | all | ' + rule.selectorText + ' | ' + rule.style.maxWidth);
        }
      }
    } catch {}
  }
  return {
    maxWidth: cs.maxWidth,
    width: el.getBoundingClientRect().width,
    rules: rules.slice(0, 12),
  };
})()`);
console.log(JSON.stringify(info, null, 1));
browser.close();
process.exit(0);
