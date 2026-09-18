// 마젠타 키잉 임계값 점검 — 배경과 "지워지면 안 되는 보라 옷" 색이 얼마나 붙어 있나 본다.
//   node tools/_keycheck.mjs assets/raw/sheets/cast/kabukicho.png
import { readFileSync } from "node:fs";
import { decodePng } from "./_canvas.mjs";
const img = decodePng(readFileSync(process.argv[2]));
const { width: w, height: h, data: d } = img;
const hsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
  let hu = 0;
  if (c) { if (mx === r) hu = 60 * (((g - b) / c) % 6); else if (mx === g) hu = 60 * ((b - r) / c + 2); else hu = 60 * ((r - g) / c + 4); }
  if (hu < 0) hu += 360;
  return [Math.round(hu), mx ? c / mx : 0, mx];
};
const at = (x, y) => { const o = (y * w + x) * 4; return [d[o], d[o + 1], d[o + 2]]; };
console.log("size", w, h, "배경 모서리", at(5, 5), hsv(...at(5, 5)).map((n) => +n.toFixed(2)));
const cw = w / 4, ch = h / 6;
const cx = Math.round(cw * 0.5), cy = Math.round(ch * 3.5);   // 4행 1열 = 손님B 서기앞
const bins = {};
for (let y = Math.max(0, cy - 80); y < Math.min(h, cy + 140); y++)
  for (let x = Math.max(0, cx - 70); x < Math.min(w, cx + 70); x++) {
    const [hu, s, v] = hsv(...at(x, y));
    if (hu >= 250 && hu <= 345 && s >= 0.2) {
      const k = `hue ${Math.round(hu / 10) * 10}  sat ${s.toFixed(1)}  val ${v.toFixed(1)}`;
      bins[k] = (bins[k] || 0) + 1;
    }
  }
console.log("보라 계열 픽셀 분포 (많은 순):");
for (const [k, n] of Object.entries(bins).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log("  ", k, n);

// 테두리 2px에서 가장 흔한 색 — 배경의 대표값
{
  const bins = {};
  const push = (x, y) => { const [r, g, b] = at(x, y); const k = `${r>>3},${g>>3},${b>>3}`; bins[k] = (bins[k] || 0) + 1; };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, 1); push(x, h - 1); push(x, h - 2); }
  for (let y = 0; y < h; y++) { push(0, y); push(1, y); push(w - 1, y); push(w - 2, y); }
  const top = Object.entries(bins).sort((a, b) => b[1] - a[1]).slice(0, 3);
  console.log("테두리 최빈색:");
  for (const [k, n] of top) {
    const [r, g, b] = k.split(",").map((v) => (+v << 3) + 4);
    const [hu, s, v] = hsv(r, g, b);
    console.log(`   rgb(${r},${g},${b})  hue ${hu} sat ${s.toFixed(2)} val ${v.toFixed(2)}   ${n}px`);
  }
}
