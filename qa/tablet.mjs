import { launchChrome, connect, newPage, nav, evalJs, setViewport } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");

for (const w of [768, 820, 834, 1024]) {
  await setViewport(page, w);
  await nav(page, "http://localhost:3000/");
  const m = await evalJs(page, `(() => {
    const info = {};
    // section paddings
    const sec = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { pt: cs.paddingTop, pb: cs.paddingBottom, h: Math.round(el.getBoundingClientRect().height) };
    };
    info.whatsNew = sec('.whats-news-area');
    info.weekly2 = sec('.weekly2-news-area');
    info.video = sec('.youtube-area');
    // sidebar position on tablet
    const sidebar = document.querySelector('.whats-news-area .col-lg-4');
    const main = document.querySelector('.whats-news-area .col-lg-8');
    if (sidebar && main) {
      const sr = sidebar.getBoundingClientRect();
      const mr = main.getBoundingClientRect();
      info.sidebarBelow = sr.top > mr.bottom - 20;
      info.sidebarTop = Math.round(sr.top);
      info.mainBottom = Math.round(mr.bottom);
    }
    // whats-news card caption offset
    const cap = document.querySelector('.whats-news-caption .what-cap');
    const img = document.querySelector('.whats-news-caption .what-img');
    if (cap && img) {
      info.capOffset = Math.round(cap.getBoundingClientRect().top - img.getBoundingClientRect().bottom);
    }
    // tabs row
    const tabs = document.querySelector('.properties__button');
    info.tabsVisible = !!tabs && tabs.getBoundingClientRect().width > 0;
    return info;
  })()`);
  console.log("VP", w, JSON.stringify(m));
}

// also measure section spacing at desktop
await setViewport(page, 1440);
await nav(page, "http://localhost:3000/");
const d = await evalJs(page, `(() => {
  const sec = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { pt: cs.paddingTop, pb: cs.paddingBottom };
  };
  return {
    whatsNew: sec('.whats-news-area'),
    weekly2: sec('.weekly2-news-area'),
    video: sec('.youtube-area'),
    recent: sec('.recent-articles'),
    heroMb: getComputedStyle(document.querySelector('.trending-top')||document.body).marginBottom,
    cardMb: getComputedStyle(document.querySelector('.single-what-news')||document.body).marginBottom,
  };
})()`);
console.log("DESKTOP", JSON.stringify(d));
browser.close();
process.exit(0);
