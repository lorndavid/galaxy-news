import { launchChrome, connect, newPage, nav, evalJs } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
const errs = [];
page.onEvent((msg) => {
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    errs.push(`${msg.params.type}: ${text.slice(0, 300)}`);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    errs.push("EXC: " + (msg.params.exceptionDetails?.exception?.description || "").slice(0, 300));
  }
  if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) {
    errs.push(`HTTP ${msg.params.response.status}: ${msg.params.response.url.slice(0, 120)}`);
  }
});
await nav(page, "http://localhost:3000/");
await new Promise((r) => setTimeout(r, 3500));
// now check state
const state = await evalJs(page, `(() => {
  const sec = document.querySelector('.whats-news-area');
  const tabs = sec ? Array.from(sec.querySelectorAll('.nav-link')).map(a=>a.textContent.trim()) : [];
  const cards = sec ? sec.querySelectorAll('.single-what-news').length : 0;
  const cats = document.querySelectorAll('.properties__button .nav-link').length;
  return { tabs, cards, cats, hasAll: tabs.includes('ទាំងអស់') };
})()`);
console.log("STATE", JSON.stringify(state));
console.log("CONSOLE", JSON.stringify(errs.slice(0, 15), null, 1));
browser.close();
process.exit(0);
