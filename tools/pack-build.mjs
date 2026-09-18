// pack-build — 모든 에셋을 한 규격, 한 폴더로 굽는다.
//
//   node tools/pack-build.mjs [--write]
//
//   assets/pack/<테마>/props/<이름>.png     가구 — 폭 = (발자국 가로칸 + 세로칸) × 16
//   assets/pack/<테마>/actors/<이름>.png    사람 — 키 고정 (서기 28 / 앉기 20)
//
// 왜 폴더 하나로 몰았나: 세트가 폴더 여기저기 흩어져 있으면 "이 테마의 이 물건"을
// 찾는 규칙이 코드마다 달라진다. 테마 5종이 **같은 파일 이름**을 쓰고 한 뿌리 아래
// 있으면, 렌더러는 테마 이름만 바꿔 끼우면 된다.
//
// 왜 폭을 발자국으로 정하나: 예전엔 "긴 변 몇 px"로 줬다. 그러면 그림 크기와
// 그 물건이 격자에서 차지하는 칸 수가 따로 놀아서, 배치가 맞아도 그림이 겹치거나 뜬다.
// 발자국으로 정하면 (gw+gd)×16 이 곧 화면 폭이라 격자와 그림이 항상 일치한다.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { decodePng, encodePng } from "./_canvas.mjs";
import {
  keyMagenta, deFringe, stripGridLines, components, mergeNear,
  cellUnion, gridBoxes, readingOrder, crop, shrink, posterize, erodeAlpha,
} from "./sheet-cut.mjs";
import { ACTOR, CAST, THEMES, widthOf, heightOf, cellsOf,
         PANEL, PANEL_ORDER, FLOOR_ORDER, FLOOR_SIZE } from "./pack-spec.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RAW = join(ROOT, "assets/raw/sheets");
const WRITE = process.argv.includes("--write");

// 기물 시트 4장의 칸 순서 → 규격 이름
const PROP_ORDER = {
  hall: ["table_6", "table_8", "chair", "dealer_chair", "stool", "sofa",
         "armchair", "lounge_table", "rug_rect", "rug_round", "side_table", "partition"],
  bar: ["bar_straight", "bar_corner", "back_bar", "beer_tap", "fridge", "sink",
        "cart", "coffee", "bottle_cabinet", "tray", "snack", "safe"],
  decor: ["pendant", "chandelier", "sconce", "art_large", "art_small", "menu_board",
          "neon", "dartboard", "jukebox", "clock", "trophy_case", "palm"],
  outdoor: ["door", "board", "stanchion", "coat_rack", "host_desk", "street_lamp",
            "tree", "bush", "bench", "flower_bed", "trash_bin", "taxi"],
};
// 테마별 원본 시트 파일명 (클래식만 초기 이름이 다르다)
const PROP_FILE = (theme, kind) =>
  theme === "classic"
    ? { hall: "sheet1_hall", bar: "sheet2_bar", decor: "sheet3_decor", outdoor: "sheet4_outdoor" }[kind]
    : `theme_${theme}_${kind}`;

/** 바닥 시트 전용 — 성분 찾기를 건너뛰고 균등 격자로만 나눈다. (fitTile 주석 참고) */
function tileCells(file, cols, rows) {
  const img = deFringe(stripGridLines(keyMagenta(decodePng(readFileSync(file)))));
  return { img, boxes: readingOrder(gridBoxes(img, cols, rows), rows), n: cols * rows };
}

/** 시트 한 장을 칸 순서대로 잘라 이미지 배열로 돌려준다. */
function pieces(file, cols, rows) {
  const img = deFringe(stripGridLines(keyMagenta(decodePng(readFileSync(file)))));
  const want = cols * rows;
  const minArea = Math.round((img.width * img.height) / 4000);
  const raw = components(img, minArea);
  let boxes = [];
  for (let t = 0; t < 8; t++) {
    const gap = Math.round(img.width * 0.005 * Math.pow(1.45, t));
    const cand = mergeNear(raw, gap).filter((b) => (b.x1 - b.x0) > 8 && (b.y1 - b.y0) > 8);
    if (!boxes.length) boxes = cand;
    if (cand.length === want) { boxes = cand; break; }
    if (cand.length < want) break;
    boxes = cand;
  }
  // 꼭짓점만 맞닿아 한 덩어리가 된 경우(바닥 타일 시트) — 알파를 깎아 떼어내고
  // 찾은 박스를 다시 그만큼 넓힌다. 격자 균등분할보다 훨씬 정확하다.
  if (boxes.length < want) {
    for (const n of [2, 4, 7]) {
      const er = components(erodeAlpha(img, n), minArea);
      const cand = mergeNear(er, Math.round(img.width * 0.004)).filter((b) => (b.x1 - b.x0) > 8 && (b.y1 - b.y0) > 8);
      if (cand.length === want) {
        boxes = cand.map((b) => ({
          x0: Math.max(0, b.x0 - n), y0: Math.max(0, b.y0 - n),
          x1: Math.min(img.width - 1, b.x1 + n), y1: Math.min(img.height - 1, b.y1 + n),
        }));
        break;
      }
    }
  }
  let ordered;
  if (boxes.length === want) ordered = readingOrder(boxes, rows);
  else if (boxes.length > want) {
    const cells = cellUnion(boxes, cols, rows, img.width, img.height);
    ordered = cells.filter(Boolean).length === want ? cells : readingOrder(gridBoxes(img, cols, rows), rows);
  } else ordered = readingOrder(gridBoxes(img, cols, rows), rows);
  return { img, boxes: ordered, n: boxes.length };
}

/** 박스 안에서 실제로 그려진 부분까지 박스를 조인다.
 *  성분 찾기가 실패해 격자 균등분할로 떨어졌을 때, 박스가 칸 전체(마젠타 여백 포함)라
 *  "윗면만 자르기" 같은 계산이 어긋난다. 그 전에 한 번 조여 준다. */
function tighten(img, box) {
  const { width: W, data } = img;
  let x0 = box.x1, x1 = box.x0, y0 = box.y1, y1 = box.y0;
  for (let y = box.y0; y <= box.y1; y++)
    for (let x = box.x0; x <= box.x1; x++)
      if (data[(y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
  return x1 >= x0 && y1 >= y0 ? { x0, x1, y0, y1 } : box;
}

/** 바닥 타일 — 마름모 **윗면만** 잘라 32×16 으로.
 *
 *  바닥 시트는 성분 찾기를 안 쓴다. 마름모가 체크무늬로 꼭 맞물려 꼭짓점끼리 닿기
 *  때문에 무엇을 해도 한 덩어리로 묶인다(알파를 8px 깎아도 안 떨어졌다).
 *  대신 **타일이 칸을 꽉 채운다**는 성질을 쓴다 — 균등 격자로 나누면 칸 폭이 곧
 *  타일 폭이다. 남은 문제는 세로 위치뿐이고, 그건 칸 안쪽에서 **가장 넓은 행**(마름모의
 *  긴 대각선)을 찾으면 된다. 이웃의 꼭짓점이 칸 가장자리에 걸치므로 안쪽으로 조금
 *  들어가서 찾는다. 윗면은 거기서 위아래로 각각 폭의 1/4 이다(2:1 마름모니까).
 *  이러면 모델이 두께를 그리든 안 그리든 결과가 같다.
 */
function fitTile(img, box, w, h) {
  const { width: W, data } = img;
  const bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1;
  const ix0 = box.x0 + Math.round(bw * 0.18), ix1 = box.x1 - Math.round(bw * 0.18);
  const iy0 = box.y0 + Math.round(bh * 0.05), iy1 = box.y1 - Math.round(bh * 0.05);
  let ym = Math.round((box.y0 + box.y1) / 2), best = -1;
  for (let y = iy0; y <= iy1; y++) {
    let c = 0;
    for (let x = ix0; x <= ix1; x++) if (data[(y * W + x) * 4 + 3] > 8) c++;
    if (c > best) { best = c; ym = y; }
  }
  const half = Math.round(bw / 4);
  const top = { x0: box.x0, x1: box.x1, y0: Math.max(0, ym - half), y1: Math.min(img.height - 1, ym + half) };
  return { ...fillDiamond(posterize(shrink(crop(img, top), w, h), 12)), w, h };
}

/** 마름모 꼭짓점을 메운다.
 *  축소할 때 덮인 면적이 42%에 못 미치는 픽셀은 버린다(작은 크기에서 테두리가
 *  지저분해지는 걸 막는 규칙이다). 그런데 마름모의 위·아래 꼭짓점이 딱 그렇게 생겨서,
 *  타일을 이어 붙이면 그 자리에 바늘구멍 같은 틈이 줄줄이 난다.
 *  이상적인 마름모 안쪽인데 비어 있는 칸은 같은 줄에서 가장 가까운 색으로 채운다. */
function fillDiamond(img) {
  const { width: w, height: h, data } = img;
  const cx = (w - 1) / 2, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (data[o + 3]) continue;
      if (Math.abs(x - cx) / (w / 2) + Math.abs(y - cy) / (h / 2) > 1.0) continue;   // 마름모 밖
      let src = -1;
      for (let d = 1; d < w && src < 0; d++) {
        if (x - d >= 0 && data[(y * w + x - d) * 4 + 3]) src = (y * w + x - d) * 4;
        else if (x + d < w && data[(y * w + x + d) * 4 + 3]) src = (y * w + x + d) * 4;
      }
      for (let d = 1; d < h && src < 0; d++) {
        if (y - d >= 0 && data[((y - d) * w + x) * 4 + 3]) src = ((y - d) * w + x) * 4;
        else if (y + d < h && data[((y + d) * w + x) * 4 + 3]) src = ((y + d) * w + x) * 4;
      }
      if (src < 0) continue;
      data[o] = data[src]; data[o + 1] = data[src + 1]; data[o + 2] = data[src + 2]; data[o + 3] = 255;
    }
  }
  return img;
}

/** 벽 조각을 격자 기울기에 **강제로** 맞춘다.
 *
 *  생성물의 기울기를 믿지 않는다. 조각이 이어 붙으려면 바닥선이 정확히 1:2로
 *  내려가야 하는데(가로 16px 가는 동안 8px), 모델이 26.57°를 픽셀 단위로 지킬
 *  이유가 없다. 1px만 틀려도 조각 사이에 계단이 지고 벽이 바닥선에서 떨어진다.
 *
 *  그래서 **열마다** 그림의 위·아래 끝을 찾아, 계산해 둔 자리로 늘린다.
 *  모델이 그린 명암·두께·질감은 그대로 살고 실루엣만 격자에 맞는다.
 *    dir +1 = 북쪽 벽(오른쪽으로 갈수록 바닥이 내려간다)
 *    dir -1 = 서쪽 벽(오른쪽으로 갈수록 올라간다)
 */
function fitSlab(img, box, w, h, drop, dir) {
  const base = shrink(crop(img, box), w, h);
  const out = Buffer.alloc(w * h * 4);
  const bodyH = h - drop;                       // 벽면 자체의 높이
  for (let x = 0; x < w; x++) {
    let y0 = -1, y1 = -1;
    for (let y = 0; y < h; y++) if (base.data[(y * w + x) * 4 + 3] > 8) { if (y0 < 0) y0 = y; y1 = y; }
    if (y0 < 0) continue;
    const step = Math.round((drop * x) / (w - 1));
    const bot = dir > 0 ? h - 1 - drop + step : h - 1 - step;
    const top = bot - bodyH + 1;
    const span = y1 - y0 + 1;
    for (let y = top; y <= bot; y++) {
      if (y < 0 || y >= h) continue;
      const sy = y0 + Math.min(span - 1, Math.floor(((y - top) * span) / bodyH));
      const si = (sy * w + x) * 4, di = (y * w + x) * 4;
      if (base.data[si + 3] < 8) continue;      // 문·창의 뚫린 구멍은 뚫린 채로 둔다
      out[di] = base.data[si]; out[di + 1] = base.data[si + 1];
      out[di + 2] = base.data[si + 2]; out[di + 3] = 255;
    }
  }
  // 양 끝 열을 이웃 열로 덮는다. "가장자리에 선을 긋지 말라"고 해도 원본에는 은은한
  // 외곽선이 남고, 조각을 이어 붙이면 그게 이음매마다 세로줄로 보인다.
  for (let y = 0; y < h; y++) {
    const cp = (dst, src) => {
      const d = (y * w + dst) * 4, s2 = (y * w + src) * 4;
      out[d] = out[s2]; out[d + 1] = out[s2 + 1]; out[d + 2] = out[s2 + 2]; out[d + 3] = out[s2 + 3];
    };
    cp(0, 2); cp(1, 2); cp(w - 1, w - 3); cp(w - 2, w - 3);
  }
  return { ...posterize({ width: w, height: h, data: out }, 12), w, h };
}

/** 목표 폭(또는 키)에 맞춰 줄이고 색을 평탄화한다. */
function bake(img, box, { width, height, hmax, scale, fit }) {
  let piece = crop(img, box);
  // fit = [w, h] — 비율을 비틀어서라도 정확히 그 크기로. 벽 조각과 바닥 타일은
  // 한 픽셀만 어긋나도 이어 붙인 자리에 틈이나 계단이 보인다.
  if (fit) {
    const [fw, fh] = fit;
    return { ...posterize(shrink(piece, fw, fh), 12), w: fw, h: fh };
  }
  let k = scale || (width ? width / piece.width : height / piece.height);
  // 폭으로 맞췄는데 세로가 상한을 넘으면 세로 기준으로 다시 잡는다
  if (hmax && piece.height * k > hmax) k = hmax / piece.height;
  const dw = Math.max(1, Math.round(piece.width * k));
  const dh = Math.max(1, Math.round(piece.height * k));
  return { ...posterize(shrink(piece, dw, dh), 12), w: dw, h: dh };
}

/** 바닥선 기울기로 그림이 어느 축으로 그려졌는지 잰다.
 *  오른쪽이 더 아래면 +gx(오른쪽 아래로 뻗는 물건), 더 위면 +gy. 차이가 작으면 대칭.
 *  렌더러는 이 값을 보고 반대 축에 놓을 때 좌우반전한다 — 벽 가구 방향이 제각각이던 원인. */
function axisOf(img) {
  const { width: w, height: h, data } = img;
  const bot = [];
  for (let x = 0; x < w; x++) {
    let b = -1;
    for (let y = 0; y < h; y++) if (data[(y * w + x) * 4 + 3] > 40) b = y;
    bot.push(b);
  }
  const cols = bot.map((v, i) => i).filter((i) => bot[i] >= 0);
  if (cols.length < 6) return "sym";
  const q = Math.max(1, Math.round(cols.length * 0.2));
  const avg = (arr) => arr.reduce((s2, i) => s2 + bot[i], 0) / arr.length;
  const d = avg(cols.slice(-q)) - avg(cols.slice(0, q));
  const rel = d / Math.max(1, h);
  if (rel > 0.08) return "gx";
  if (rel < -0.08) return "gy";
  return "sym";
}

let made = 0, missing = [];
for (const theme of THEMES) {
  const propDir = join(ROOT, "assets/pack", theme, "props");
  const actDir = join(ROOT, "assets/pack", theme, "actors");
  if (WRITE) { mkdirSync(propDir, { recursive: true }); mkdirSync(actDir, { recursive: true }); }
  const manifest = {};

  // ── 가구 ──
  for (const kind of Object.keys(PROP_ORDER)) {
    const file = join(RAW, PROP_FILE(theme, kind) + ".png");
    if (!existsSync(file)) { missing.push(PROP_FILE(theme, kind)); continue; }
    const { img, boxes, n } = pieces(file, 4, 3);
    PROP_ORDER[kind].forEach((name, i) => {
      if (!boxes[i]) return;
      const out = bake(img, boxes[i], { width: widthOf(name), hmax: heightOf(name) });
      const [gw, gd] = cellsOf(name);
      manifest[name] = { w: out.w, h: out.h, axis: axisOf(out), gw, gd };
      if (WRITE) writeFileSync(join(propDir, name + ".png"), encodePng(out.w, out.h, out.data));
      made++;
    });
    console.log(`  ${theme}/${kind.padEnd(8)} 성분 ${String(n).padStart(2)} → 12개`);
  }

  // ── 사람 ──
  // 칸마다 제 바운딩 박스를 28px에 맞추면 안 된다. 팔을 든 그림은 박스가 커서 몸이
  // 작아지고, 앉은 그림은 박스가 작아서 몸이 커진다 — 그래서 키가 제각각으로 보였다.
  // 시트는 한 배율로 그려져 있으니 **서 있는 칸 하나에서 배율을 구해 24칸 전부에 쓴다.**
  const castFile = join(RAW, "cast", theme + ".png");
  if (!existsSync(castFile)) { missing.push("cast/" + theme); continue; }
  const { img, boxes, n } = pieces(castFile, 4, 6);
  const refIdx = CAST.findIndex(([nm]) => nm === "a_stand_f");
  const refBox = boxes[refIdx] || boxes[0];
  const k = ACTOR.stand / (refBox.y1 - refBox.y0 + 1);
  // 서 있는 칸에도 상한을 둔다. 한 배율 원칙은 맞지만, 시트가 한 인물만 눈에 띄게
  // 크게 그려 오는 일이 있다(가부키초 뒷모습의 손님 B가 다른 사람의 1.6배였다).
  // 제대로 그려진 칸은 28px 근처라 이 상한(32px)에 걸리지 않는다 — 튄 칸만 잡힌다.
  const STAND_MAX = Math.round(ACTOR.stand * 1.15);
  CAST.forEach(([name, pose], i) => {
    if (!boxes[i]) return;
    const out = bake(img, boxes[i], { scale: k, hmax: pose === "sit" ? ACTOR.sit : STAND_MAX });
    if (WRITE) writeFileSync(join(actDir, name + ".png"), encodePng(out.w, out.h, out.data));
    made++;
  });
  console.log(`  ${theme}/cast     성분 ${String(n).padStart(2)} → 24개 (배율 ${k.toFixed(3)} 일괄)`);

  // ── 뒷모습 시트 ──
  // 앞 시트의 뒷모습 칸은 머리와 옷이 같은 색이라 28px에서 덩어리로 뭉갰다.
  // 대비(머리 vs 옷)·목덜미 선·어깨 각을 넣어 다시 뽑은 것으로 덮어쓴다.
  // 키 기준은 앞 시트와 같다 — 서 있는 칸을 28px로 맞추면 나머지가 따라온다.
  const backFile = join(RAW, "back", theme + ".png");
  if (existsSync(backFile)) {
    const BACK = ["a_walk_b1", "a_walk_b2", "a_walk_b3", "a_walk_b4",
                  "a_stand_b", "a_sit_b", "b_stand_b", "b_sit_b",
                  "c_stand_b", "c_sit_b", "pd_stand_b", "sv_stand_b"];
    const r = pieces(backFile, 4, 3);
    const rb = r.boxes[4] || r.boxes[0];                      // a_stand_b 로 배율을 잡는다
    const kb = ACTOR.stand / (rb.y1 - rb.y0 + 1);
    BACK.forEach((name, i) => {
      if (!r.boxes[i]) return;
      const out = bake(r.img, r.boxes[i], { scale: kb, hmax: /_sit_/.test(name) ? ACTOR.sit : STAND_MAX });
      if (WRITE) writeFileSync(join(actDir, name + ".png"), encodePng(out.w, out.h, out.data));
    });
    console.log(`  ${theme}/back     성분 ${String(r.n).padStart(2)} → 12개 (배율 ${kb.toFixed(3)})`);
  }

  // ── 직원 동작 시트 ── 서빙 4프레임 × 앞뒤 + 딜러/바텐더 대기·동작
  const moFile = join(RAW, "staffmo", theme + ".png");
  if (existsSync(moFile)) {
    const MO = ["sv_walk_f1", "sv_walk_f2", "sv_walk_f3", "sv_walk_f4",
                "sv_walk_b1", "sv_walk_b2", "sv_walk_b3", "sv_walk_b4",
                "pd_idle", "pd_deal2", "bt_idle", "bt_pour"];
    const r = pieces(moFile, 4, 3);
    const rb = r.boxes[8] || r.boxes[0];                   // 서 있는 딜러로 배율을 잡는다
    const km = ACTOR.stand / (rb.y1 - rb.y0 + 1);
    MO.forEach((name, i) => {
      if (!r.boxes[i]) return;
      const out = bake(r.img, r.boxes[i], { scale: km, hmax: STAND_MAX });
      if (WRITE) writeFileSync(join(actDir, name + ".png"), encodePng(out.w, out.h, out.data));
    });
    console.log(`  ${theme}/staffmo  성분 ${String(r.n).padStart(2)} → 12개`);
  }

  // ── 좌석 방향 시트 ── 의자·소파가 앞/뒤 두 장 있어야 반전으로 4방향이 된다
  const seatFile = join(RAW, "seat", theme + ".png");
  if (existsSync(seatFile)) {
    const SEAT = ["chair_f", "chair_b", "dealer_chair_f", "dealer_chair_b",
                  "armchair_f", "armchair_b", "sofa_f", "sofa_b",
                  "bench_f", "bench_b", "stool2", "lounge_table2"];
    const WIDTHS = { chair_f: "chair", chair_b: "chair", dealer_chair_f: "dealer_chair",
                     dealer_chair_b: "dealer_chair", armchair_f: "armchair", armchair_b: "armchair",
                     sofa_f: "sofa", sofa_b: "sofa", bench_f: "bench", bench_b: "bench",
                     stool2: "stool", lounge_table2: "lounge_table" };
    const r = pieces(seatFile, 4, 3);
    SEAT.forEach((name, i) => {
      if (!r.boxes[i]) return;
      const ref = WIDTHS[name];
      const out = bake(r.img, r.boxes[i], { width: widthOf(ref), hmax: heightOf(ref) });
      const [gw, gd] = cellsOf(ref);
      manifest[name] = { w: out.w, h: out.h, axis: axisOf(out), gw, gd };
      if (WRITE) writeFileSync(join(propDir, name + ".png"), encodePng(out.w, out.h, out.data));
    });
    console.log(`  ${theme}/seat     성분 ${String(r.n).padStart(2)} → 12개`);
  }
  // ── 벽 조각 시트 ── 화면 규격이 정해져 있으므로 정확히 그 크기로 굽는다.
  const wallFile = join(RAW, "wall", theme + ".png");
  if (existsSync(wallFile)) {
    const r = pieces(wallFile, 4, 3);
    PANEL_ORDER.forEach((name, i) => {
      if (!r.boxes[i]) return;
      const [pw, ph] = PANEL[name];
      // 기둥·몰딩은 벽면이 아니라 덧대는 것이라 기울기를 강제하지 않는다
      const slanted = /^wall_[nw]_/.test(name);
      const out = slanted
        ? fitSlab(r.img, r.boxes[i], pw, ph, 8, name.startsWith("wall_n_") ? 1 : -1)
        : bake(r.img, r.boxes[i], { fit: PANEL[name] });
      manifest[name] = { w: out.w, h: out.h, gw: 0, gd: 0 };
      if (WRITE) writeFileSync(join(propDir, name + ".png"), encodePng(out.w, out.h, out.data));
    });
    console.log(`  ${theme}/wall     성분 ${String(r.n).padStart(2)} → 12개`);
  }

  // ── 바닥 타일 시트 ──
  const floorFile = join(RAW, "floor", theme + ".png");
  if (existsSync(floorFile)) {
    const r = tileCells(floorFile, 4, 3);
    FLOOR_ORDER.forEach((name, i) => {
      if (!r.boxes[i]) return;
      const out = fitTile(r.img, r.boxes[i], FLOOR_SIZE[0], FLOOR_SIZE[1]);
      manifest[name] = { w: out.w, h: out.h, gw: 0, gd: 0 };
      if (WRITE) writeFileSync(join(propDir, name + ".png"), encodePng(out.w, out.h, out.data));
    });
    console.log(`  ${theme}/floor    성분 ${String(r.n).padStart(2)} → 12개`);
  }

  if (WRITE) writeFileSync(join(ROOT, "assets/pack", theme, "manifest.json"), JSON.stringify(manifest, null, 1));
}

console.log(`\n${made}개 ${WRITE ? "저장" : "(--write 필요)"} — assets/pack/<테마>/{props,actors}`);
if (missing.length) console.log("원본 없음: " + missing.join(", "));
