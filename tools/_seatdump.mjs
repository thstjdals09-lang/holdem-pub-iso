// 좌석·사람 좌표를 숫자로 찍어 본다. 그림으로는 "어긋났다"까지만 알 수 있어서,
// 어디가 얼마나 어긋났는지는 이걸로 본다.
//   node tools/_seatdump.mjs [테이블수] [점유율] [테마]
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, "scene2d-preview.mjs"), "utf8");
const tail = `
const L = PubScene3D.__layout();
const t0 = L.slots.find((x) => x.owned);
console.log("테이블0 중심  (" + t0.cx.toFixed(2) + ", " + t0.cy.toFixed(2) + ")");
const seated = L.people.filter((p) => p.seat);
console.log("앉은 사람 " + seated.length + "명 (전체 " + L.people.length + "명)");
for (const p of seated) {
  const d = Math.hypot(p.gx - t0.cx, p.gy - t0.cy);
  console.log("  (" + p.gx.toFixed(2) + ", " + p.gy.toFixed(2) + ")  테이블0에서 " +
              d.toFixed(2) + "칸   보는쪽 " + p.hx.toFixed(2) + "," + p.hy.toFixed(2));
}
`;
const patched = src.replace(/\/\/ ---- 탭 판정 훑기[\s\S]*$/, tail);
const tmp = join(HERE, "_tmp_seatdump.mjs");
writeFileSync(tmp, patched);
try { await import("file://" + tmp.split(String.fromCharCode(92)).join("/")); } finally { try { unlinkSync(tmp); } catch (e) {} }
