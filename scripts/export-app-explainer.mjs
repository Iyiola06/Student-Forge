import { mkdirSync, existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));
if (!chromePath) {
  throw new Error("No Chrome or Edge executable was found.");
}

const root = process.cwd();
const outputDir = join(root, "output", "app-explainer");
const outputFile = join(outputDir, "vui-studify-explainer.webm");
mkdirSync(outputDir, { recursive: true });
if (existsSync(outputFile)) {
  rmSync(outputFile);
}

const userDataDir = join(outputDir, "chrome-profile");
mkdirSync(userDataDir, { recursive: true });

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--mute-audio",
    "--window-size=1280,720",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-features=DownloadBubble,OptimizationHints",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=9222",
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDebugger() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error("Chrome debugger endpoint did not start.");
}

let messageId = 0;
function createSession(ws) {
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
    }
  });
  return function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++messageId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };
}

async function exportVideo() {
  await waitForDebugger();
  const newTargetRes = await fetch("http://127.0.0.1:9222/json/new?http://127.0.0.1:3001/app-explainer.html", { method: "PUT" });
  const target = await newTargetRes.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const send = createSession(ws);

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: outputDir,
  });
  await send("Page.navigate", { url: "http://127.0.0.1:3001/app-explainer.html" });

  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    if (existsSync(outputFile)) {
      const stats = statSync(outputFile);
      if (stats.size > 0) {
        await sleep(1000);
        ws.close();
        chrome.kill();
        return outputFile;
      }
    }
    await sleep(1000);
  }

  ws.close();
  chrome.kill();
  throw new Error("Timed out waiting for the exported video.");
}

exportVideo()
  .then((file) => {
    console.log(file);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    chrome.kill();
    process.exit(1);
  });
