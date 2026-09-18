// 바닥 타일 12개를 격자로 이어 붙여 본다 — 실제로 쓰일 모습 그대로 확인하는 게 빠르다.
//   node tools/_tilecheck.mjs <테마>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, makeCanvas, toPng } from "./_canvas.mjs";
import { FLOOR_ORDER } from "./pack-spec.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const theme = process.argv[2] || "classic";
const Z = 4, TW = 32 * Z, TH = 16 * Z;
const cv = makeCanvas(TW * 7, TH * 13);
const ctx = cv.getContext("2d");
ctx.fillStyle = "#101014"; ctx.fillRect(0, 0, cv.width, cv.height);
FLOOR_ORDER.forEach((name, i) => {
  let im;
  try { im = decodePng(readFileSync(join(ROOT, "assets/pack", theme, "props", name + ".png"))); } catch { return; }
  const row = i % 3, col = (i / 3) | 0;
  // 같은 타일 2×2 를 이어 붙여 이음매를 본다
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    const gx = a, gy = b;
    const px = col * TW * 2 + (gx - gy) * (TW / 2) + TW;
    const py = row * TH * 4 + (gx + gy) * (TH / 2) + TH;
    ctx.drawImage(im, 0, 0, im.width, im.height, Math.round(px - TW / 2), Math.round(py - TH / 2), TW, TH);
  }
});
mkdirSync(join(ROOT, "tools/_preview"), { recursive: true });
writeFileSync(join(ROOT, `tools/_preview/tiles-${theme}.png`), toPng(cv));
console.log(`tiles-${theme}.png`);
