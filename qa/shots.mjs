import { launchChrome, connect, newPage, nav, setViewport, shot } from "./cdp.mjs";
const { endpoint } = await launchChrome({});
const browser = await connect(endpoint);
const page = await newPage(browser);
await page.send("Network.enable");
const shots = [
  [390, 844, "mobile"],
  [768, 1024, "tablet"],
  [1440, 900, "desktop"],
];
for (const [w, h, name] of shots) {
  await setViewport(page, w, h);
  await nav(page, "http://localhost:3000/");
  await new Promise((r) => setTimeout(r, 1500));
  await shot(page, `qa/shot-home-${name}.png`);
}
// article page desktop
await setViewport(page, 1440, 900);
await nav(page, "http://localhost:3000/");
const slug = await page.evalJs ? null : null;
browser.close();
process.exit(0);
