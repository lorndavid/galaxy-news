// Minimal Chrome DevTools Protocol driver using Node's native WebSocket.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME =
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

let seq = 0;
const pending = new Map();

export async function launchChrome({ headless = true, viewport = { width: 1440, height: 900 }, profileDir, userData } = {}) {
  const dir =
    profileDir ||
    fs.mkdtempSync(path.join(os.tmpdir(), "chrome-cdp-"));
  const args = [
    CHROME,
    "--remote-debugging-port=0",
    `--user-data-dir=${dir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-features=Translate,OptimizationHints",
    "--window-size=1440,900",
  ];
  if (headless) args.push("--headless=new");
  const proc = spawn(args[0], args.slice(1), { stdio: "ignore" });

  // wait for the DevTools endpoint
  let endpoint;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 250));
    try {
      const res = await fetch(`http://127.0.0.1:${proc.pid ? "" : ""}`, { signal: AbortSignal.timeout(1000) }).catch(() => null);
    } catch {}
    try {
      const raw = fs.readFileSync(path.join(dir, "DevToolsActivePort"), "utf8");
      const [port, wsPath] = raw.trim().split("\n");
      endpoint = `ws://127.0.0.1:${port}${wsPath}`;
      break;
    } catch {}
  }
  if (!endpoint) throw new Error("Chrome DevTools endpoint not found");
  return { proc, dir, endpoint };
}

export function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const api = {
    ws,
    send(method, params = {}, sessId) {
      return new Promise((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params, sessionId: sessId }));
      });
    },
    onEvent(fn) {
      ws.addEventListener("message", (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.method && !msg.id) fn(msg);
      });
    },
    close() {
      try { ws.close(); } catch {}
    },
  };
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve(api));
    ws.addEventListener("error", reject);
  });
}

export async function newPage(api) {
  const { targetId } = await api.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await api.send("Target.attachToTarget", { targetId, flatten: true });
  const page = {
    ...api,
    targetId,
    sessionId,
    send(method, params = {}) {
      return api.send(method, params).then(() => undefined); // placeholder, replaced below
    },
  };
  // wrap: send with sessionId
  const origSend = api.send.bind(api);
  page.send = (method, params = {}) => origSend(method, params, sessionId);
  return page;
}

export async function nav(page, url, { waitUntil = "load" } = {}) {
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 400));
  // wait for network idle-ish
  for (let i = 0; i < 40; i++) {
    const st = await page.send("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (st.result.value === "complete") break;
    await new Promise((r) => setTimeout(r, 250));
  }
  await new Promise((r) => setTimeout(r, 1200)); // allow SPA mount + data fetch
}

export async function evalJs(page, expression) {
  const res = await page.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error("eval failed: " + JSON.stringify(res.exceptionDetails).slice(0, 500));
  }
  return res.result.value;
}

export async function setViewport(page, width, height = 900) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await new Promise((r) => setTimeout(r, 300));
}

export async function shot(page, path) {
  const { data } = await page.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path, Buffer.from(data, "base64"));
}

export async function consoleErrors(page) {
  const errs = [];
  const sub = page.onEvent((msg) => {
    if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
      const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
      errs.push(`${msg.params.type}: ${text}`);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      errs.push("exception: " + (msg.params.exceptionDetails?.exception?.description || ""));
    }
    if (msg.method === "Network.loadingFailed") {
      errs.push(`netfail: ${msg.params.errorText} (${msg.params.type})`);
    }
  });
  await new Promise((r) => setTimeout(r, 300));
  return errs;
}
