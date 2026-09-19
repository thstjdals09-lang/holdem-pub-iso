// 배치 모드를 브라우저 없이 시험한다 — 집고, 끌고, 놓고, 정말 옮겨졌는지 본다.
//   node tools/_edittest.mjs
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, "scene2d-preview.mjs"), "utf8");
const tail = `
// ---- 배치 모드 시험 ----
const S2 = PubScene3D;
const before = S2.__layout().slots.find((t) => t.owned);
console.log("옮기기 전 테이블0  (" + before.cx.toFixed(2) + ", " + before.cy.toFixed(2) + ")");

S2.setEditMode(true);
frameFn(1600);                                  // 한 프레임 그려야 집을 목록이 생긴다
const grabX = OXY.px, grabY = OXY.py;
console.log("집는 자리 화면좌표 (" + grabX + ", " + grabY + ")");
handlers.pointerdown({ clientX: grabX, clientY: grabY, pointerId: 1 });
const held = S2.__hold();
console.log("집었나: " + (held ? held.id + " (" + held.gw + "x" + held.gd + "칸)" : "못 집음"));

// 오른쪽 아래로 두 칸쯤 끌어 본다
handlers.pointermove({ clientX: grabX + 64, clientY: grabY + 32, pointerId: 1 });
const moving = S2.__hold();
console.log("끄는 중  (" + moving.cx.toFixed(2) + ", " + moving.cy.toFixed(2) + ")  놓을 수 있나: " + moving.ok);
handlers.pointerup({ clientX: grabX + 64, clientY: grabY + 32, pointerId: 1 });

const after = S2.__layout().slots.find((t) => t.owned);
console.log("옮긴 뒤 테이블0   (" + after.cx.toFixed(2) + ", " + after.cy.toFixed(2) + ")");
console.log(after.cx !== before.cx || after.cy !== before.cy ? "✓ 옮겨졌다" : "✗ 그대로다");

// 의자와 손님이 따라왔는지
const seated = S2.__layout().people.filter((p) => p.seat);
const near = seated.filter((p) => Math.hypot(p.gx - after.cx, p.gy - after.cy) < 2.2);
console.log("새 자리 둘레에 앉은 손님 " + near.length + "명");

// 놓은 뒤에는 한 프레임 그려야 "집을 수 있는 목록"이 새 자리로 갱신된다
frameFn(1650);
// 들고 있는 상태의 화면을 찍는다 — 격자와 초록/빨강 표시가 나와야 한다
handlers.pointerdown({ clientX: grabX + 64, clientY: grabY + 32, pointerId: 1 });
handlers.pointermove({ clientX: grabX + 64, clientY: grabY + 96, pointerId: 1 });
const h2 = S2.__hold();
console.log("두 번째로 집어 끄는 중 (" + h2.cx.toFixed(2) + ", " + h2.cy.toFixed(2) + ") 놓을 수 있나: " + h2.ok);
frameFn(1700);
// 다른 테이블 위로 끌어 보면 거절해야 한다
const other = S2.__layout().slots.filter((t) => t.owned)[1];
if (other) {
  const o = S2.__screen(other.cx, other.cy);
  handlers.pointermove({ clientX: o.px, clientY: o.py, pointerId: 1 });
  const bad = S2.__hold();
  console.log("다른 테이블 위 (" + bad.cx.toFixed(2) + ", " + bad.cy.toFixed(2) + ") 놓을 수 있나: " + bad.ok + (bad.ok ? "  ← 거절해야 하는데!" : "  ✓ 거절"));
  frameFn(1750);
}
handlers.pointerup({ clientX: grabX, clientY: grabY, pointerId: 1 });
mkdirSync(join(ROOT, "tools/_preview"), { recursive: true });
writeFileSync(join(ROOT, "tools/_preview/edit.png"), toPng(surface, 1, [20, 16, 13]));
console.log("✓ edit.png 저장");
`;
let patched = src.replace(/\/\/ ---- 탭 판정 훑기[\s\S]*$/, tail);
// 테이블0 의 화면 좌표를 계산해 두는 줄을 끼워 넣는다
patched = patched.replace("PubScene3D.chipBurst(\"#f0c04a\");",
  `PubScene3D.chipBurst("#f0c04a");
const L0 = PubScene3D.__layout();
const t00 = L0.slots.find((t) => t.owned);
const OXY = PubScene3D.__screen(t00.cx, t00.cy);`);
const tmp = join(HERE, "_tmp_edittest.mjs");
writeFileSync(tmp, patched);
try { await import("file://" + tmp.split(String.fromCharCode(92)).join("/")); }
finally { try { unlinkSync(tmp); } catch (e) {} }
