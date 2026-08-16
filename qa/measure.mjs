// Measure typography + overflow at all breakpoints on the live site.
import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";

const BASE = "http://localhost:3000";
const VIEWPORTS = [320, 375, 390, 414, 600, 768, 834, 1024, 1280, 1440, 1920];

const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");

const results = [];
for (const w of VIEWPORTS) {
  await setViewport(page, w);
  await nav(page, `${BASE}/`);
  const m = await evalJs(page, `(() => {
    const ow = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    // find overflowing elements
    const offenders = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > cw + 1 || r.left < -1) {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '';
        offenders.push(tag + '.' + cls + ' [' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
      }
    });
    const fs = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fontSize : null;
    };
    const cont = document.querySelector('.container');
    return {
      overflow: ow - cw,
      offenderCount: offenders.length,
      offenders: offenders.slice(0, 8),
      heroH1: fs('.trend-top-cap h1'),
      heroSpan: fs('.trend-top-cap span'),
      sectionH3: fs('.section-tittle h3'),
      cardH4: fs('.what-cap h4'),
      cardMeta: fs('.card-meta-line'),
      navA: fs('.main-menu ul li a'),
      containerW: cont ? Math.round(cont.getBoundingClientRect().width) : null,
      headerH: Math.round((document.querySelector('.header-bottom')||document.querySelector('header')||{}).getBoundingClientRect?.().height || 0),
    };
  })()`);
  results.push({ vp: w, ...m });
  console.log(JSON.stringify({ vp: w, overflow: m.overflow, offenders: m.offenderCount, hero: m.heroH1, section: m.sectionH3, card: m.cardH4, navA: m.navA, cont: m.containerW, headerH: m.headerH, first: m.offenders[0] || null }));
}

// also article page at a few sizes
for (const w of [375, 768, 1440]) {
  await setViewport(page, w);
  await nav(page, `${BASE}/article/`);
  const slugs = await evalJs(page, `Array.from(document.querySelectorAll('a[href^="/article/"]')).map(a=>a.getAttribute('href')).slice(0,3)`);
  if (slugs && slugs.length) {
    await nav(page, `${BASE}${slugs[0]}`);
    const m = await evalJs(page, `(() => {
      const ow = document.documentElement.scrollWidth;
      const cw = document.documentElement.clientWidth;
      const content = document.querySelector('.news-content');
      const h1 = document.querySelector('h1');
      return {
        overflow: ow - cw,
        contentW: content ? Math.round(content.getBoundingClientRect().width) : null,
        contentFS: content ? getComputedStyle(content).fontSize : null,
        h1FS: h1 ? getComputedStyle(h1).fontSize : null,
        h1LH: h1 ? getComputedStyle(h1).lineHeight : null,
      };
    })()`);
    console.log("ARTICLE", JSON.stringify({ vp: w, ...m }));
  }
}

browser.close();
process.exit(0);
