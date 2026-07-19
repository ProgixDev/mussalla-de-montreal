// Dev-only screenshot helper (not part of the app build). Usage:
//   node scripts/shot.mjs <out.png> <url> [width] [height] [full]
import { chromium } from "@playwright/test";
const [, , out, url, w = "1280", h = "1200", full] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({
  viewport: { width: parseInt(w, 10), height: parseInt(h, 10) },
  deviceScaleFactor: 2,
});
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: full === "full" });
await b.close();
console.log("saved", out);
