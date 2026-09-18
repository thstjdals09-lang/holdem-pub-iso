// 벽 조각을 실제처럼 여러 장 이어 붙여 본다 — 이음매와 기울기를 눈으로 확인한다.
//   node tools/_wallcheck.mjs <테마>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, makeCanvas, toPng } from "./_canvas.mjs";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const theme = process.argv[2] || "classic";
const Z = 3;
const cv = makeCanvas(1000, 640);
const ctx = cv.getContext("2d");
ctx.fillStyle = "#101014"; ctx.fillRect(0, 0, cv.width, cv.height);
const load = (n) => { try { return decodePng(readFileSync(join(ROOT, "assets/pack", theme, "props", n + ".png"))); } catch { return null; } };
const rows = [["wall_n_wain", 1], ["wall_w_wain", -1], ["wall_n_plain", 1], ["wall_n_door", 1]];
rows.forEach(([name, dir], r) => {
  const im = load(name); if (!im) return;
  const w = im.width * Z, h = im.height * Z;
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * w;
    const y = 40 + r * 150 + (dir > 0 ? i * 8 * Z : -i * 8 * Z) + (dir > 0 ? 0 : 5 * 8 * Z);
    ctx.drawImage(im, 0, 0, im.width, im.height, x, y, w, h);
  }
});
mkdirSync(join(ROOT, "tools/_preview"), { recursive: true });
writeFileSync(join(ROOT, `tools/_preview/wall-${theme}.png`), toPng(cv));
console.log(`wall-${theme}.png`);
