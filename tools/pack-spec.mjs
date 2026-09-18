// pack-spec — 에셋 크기 기준표. 이 파일 하나가 모든 에셋의 크기를 정한다.
//
// ── 기준 ────────────────────────────────────────────────────────────────
//   타일 1칸 = 실제 1m,  타일 그림 32×16px  (화면에는 ×2로 찍는다)
//   사람 키 1.7m = 28px   →  1m ≈ 16.5px
//
// 모든 물건을 "실제 치수"로 적는다: [가로 m, 세로 m, 높이 m].
// 거기서 두 값을 계산한다.
//   화면 폭   = (가로 + 세로) × 16            ← 발자국이 격자에서 차지하는 폭
//   그림 높이 = (가로 + 세로) × 8 + 높이 × 16.5   ← 바닥 마름모 + 물건 높이
//
// 왜 이렇게까지 하나: 처음엔 "긴 변 몇 px"로, 다음엔 발자국만 정하고 높이는 눈대중으로
// 줬다. 그러면 문이 사람 두 배가 되고 소파가 사람만큼 높아진다. 미터로 적으면
// 서로의 크기가 저절로 맞는다 — 문 2.1m, 의자 0.9m, 나무 4m 처럼.
export const TILE = { w: 32, h: 16 };
export const PX_PER_M = 16.5;
export const ACTOR = { stand: 28, sit: 21 };   // 서면 1.7m / 앉으면 1.27m
// 앉은 칸은 반드시 이 상한을 건다. 2등신 그림은 머리가 커서 앉아도 박스 높이가
// 서 있을 때와 거의 같게 나온다 — 그대로 쓰면 "앉은 건지 선 건지" 구분이 안 되고,
// 테이블 앞자리 손님이 펠트를 절반이나 덮는다.

/** [가로 m, 세로 m, 높이 m]. 벽에 거는 것은 세로 0 (발자국이 없다). */
export const SIZE = {
  // ── 홀 ──
  table_6:      [2.2, 1.2, 0.75],
  table_8:      [2.8, 1.3, 0.75],
  chair:        [0.5, 0.5, 0.9],
  dealer_chair: [0.6, 0.6, 1.0],
  stool:        [0.4, 0.4, 0.75],
  sofa:         [1.8, 0.8, 0.85],
  armchair:     [0.9, 0.85, 0.9],
  lounge_table: [0.8, 0.8, 0.75],
  side_table:   [0.6, 0.6, 0.7],
  partition:    [1.6, 0.2, 1.8],
  rug_rect:     [2.6, 1.8, 0],
  rug_round:    [2.2, 2.2, 0],
  // ── 바 ──
  bar_straight: [2.0, 0.7, 1.1],
  bar_corner:   [1.4, 1.4, 1.1],
  back_bar:     [1.6, 0.4, 1.9],
  beer_tap:     [0.4, 0.3, 0.6],
  fridge:       [0.8, 0.7, 1.9],
  sink:         [0.8, 0.6, 0.9],
  cart:         [0.9, 0.6, 0.9],
  coffee:       [0.5, 0.45, 0.5],
  bottle_cabinet: [1.0, 0.4, 1.8],
  tray:         [0.5, 0.4, 0.12],
  snack:        [0.35, 0.3, 0.08],
  safe:         [0.7, 0.6, 0.8],
  // ── 장식·조명 ──
  pendant:      [0.5, 0.5, 0.5],
  chandelier:   [0.9, 0.9, 0.8],
  sconce:       [0.4, 0.2, 0.4],
  jukebox:      [0.8, 0.6, 1.5],
  trophy_case:  [1.1, 0.5, 1.8],
  palm:         [0.9, 0.9, 2.2],
  // 벽에 거는 것 — 세로 0, 폭만 쓴다
  art_large:    [1.0, 0, 0],
  art_small:    [0.6, 0, 0],
  menu_board:   [0.8, 0, 0],
  neon:         [1.0, 0, 0],
  dartboard:    [0.5, 0, 0],
  clock:        [0.4, 0, 0],
  // ── 입구·바깥 ──
  door:         [1.0, 0.25, 2.1],
  board:        [0.7, 0.6, 1.0],
  stanchion:    [0.8, 0.35, 1.0],
  coat_rack:    [0.6, 0.6, 1.8],
  host_desk:    [1.6, 0.7, 1.1],
  street_lamp:  [0.5, 0.5, 3.5],
  tree:         [1.6, 1.6, 4.0],
  bush:         [0.8, 0.8, 0.6],
  bench:        [1.5, 0.6, 0.85],
  flower_bed:   [1.2, 0.6, 0.5],
  trash_bin:    [0.6, 0.6, 0.9],
  taxi:         [4.2, 1.8, 1.5],
};

/** 화면 폭(px) = 발자국이 격자에서 차지하는 폭. */
export function widthOf(name) {
  const m = SIZE[name];
  if (!m) return null;
  return Math.max(6, Math.round((m[0] + m[1]) * (TILE.w / 2)));
}

/** 그림 높이 상한(px) = 바닥 마름모 + 물건 높이. 벽에 거는 것은 상한 없음. */
export function heightOf(name) {
  const m = SIZE[name];
  if (!m || m[1] === 0) return null;
  return Math.max(6, Math.round((m[0] + m[1]) * (TILE.h / 2) + m[2] * PX_PER_M));
}

/** 캐릭터 24칸 — 시트 읽는 순서 그대로.
 *  걷기는 4프레임 사이클(접지-통과내림-접지-통과올림)을 앞/뒤 두 방향으로 들고 있다.
 *  아이소 4방향은 이 둘을 좌우반전해서 만든다:
 *    남동(오른쪽 아래) = 앞모습 원본 / 남서(왼쪽 아래) = 앞모습 반전
 *    북서(왼쪽 위)   = 뒷모습 원본 / 북동(오른쪽 위)  = 뒷모습 반전
 */
export const CAST = [
  ["a_walk_f1", "stand"], ["a_walk_f2", "stand"], ["a_walk_f3", "stand"], ["a_walk_f4", "stand"],
  ["a_walk_b1", "stand"], ["a_walk_b2", "stand"], ["a_walk_b3", "stand"], ["a_walk_b4", "stand"],
  ["a_stand_f", "stand"], ["a_sit_f", "sit"], ["a_stand_b", "stand"], ["a_sit_b", "sit"],
  ["b_stand_f", "stand"], ["b_sit_f", "sit"], ["b_stand_b", "stand"], ["b_sit_b", "sit"],
  ["c_stand_f", "stand"], ["c_sit_f", "sit"], ["c_stand_b", "stand"], ["c_sit_b", "sit"],
  ["pd_stand", "stand"], ["pd_deal", "stand"], ["sv_stand", "stand"], ["sv_tray", "stand"],
];

export const THEMES = ["classic", "princess", "neon", "european", "japanese", "kabukicho"];

/** 발자국이 격자에서 차지하는 칸 수 [가로, 세로]. 타일 1칸 = 1m 이므로 미터를 올림한다.
 *  벽에 거는 것(세로 0)은 바닥을 안 쓰므로 [0, 0].
 *  렌더러의 점유 격자가 이 값을 읽는다 — 배치와 충돌이 같은 숫자를 쓰게 하려는 것이다. */
export function cellsOf(name) {
  const m = SIZE[name];
  if (!m) return [1, 1];
  if (m[1] === 0) return [0, 0];
  return [Math.max(1, Math.round(m[0])), Math.max(1, Math.round(m[1]))];
}

// ── 벽 조각 · 바닥 타일 ──────────────────────────────────────────────────
//  이 둘은 "발자국 몇 칸"이 아니라 **화면 규격이 딱 정해져 있다.** 그래서 프롬프트에
//  픽셀 치수를 그대로 적어 준다.
//
//  벽 조각 한 개 = 타일 한 칸의 모서리. 화면에서 이렇게 생겼다(S=1 기준):
//      가로 16 = TW/2          ← 타일 한 칸을 가는 동안의 화면 가로 이동
//      바닥선 하강 8 = TH/2    ← 같은 동안의 세로 이동. 기울기가 정확히 1:2다
//      벽 높이 76 = WALL_H/S
//      그림 전체 = 16 × 84 (76 + 8)
//  **기울기 1:2를 못 지키면 조각끼리 계단이 지고 벽이 바닥선에서 떨어진다.**
//  구운 뒤 tools/_slant.mjs 로 재서 확인한다.
//
//  북쪽 벽과 서쪽 벽을 따로 뽑는다. 좌우반전으로 만들면 빨라 보이지만 좌상단 광원이
//  같이 뒤집혀 두 벽의 명암이 거꾸로 된다.
export const PANEL = {
  wall_n_plain:  [16, 84], wall_w_plain:  [16, 84],
  wall_n_wain:   [16, 84], wall_w_wain:   [16, 84],
  wall_n_door:   [16, 84], wall_w_door:   [16, 84],
  wall_n_window: [16, 84], wall_w_window: [16, 84],
  wall_corner:   [10, 88],          // 두 벽이 만나는 모서리 기둥 — 조금 높다
  wall_pillar:   [8, 84],           // 벽면 중간 기둥
  wall_n_half:   [16, 38], wall_w_half: [16, 38],   // 허리벽(앞벽) = FRONT_H/S + 8
};
export const PANEL_ORDER = [
  "wall_n_plain", "wall_w_plain", "wall_n_wain", "wall_w_wain",
  "wall_n_door", "wall_w_door", "wall_n_window", "wall_w_window",
  "wall_corner", "wall_pillar", "wall_n_half", "wall_w_half",
];

//  바닥 타일은 타일 한 칸 그대로 = 32×16 마름모. 한 픽셀만 어긋나도 이어 붙인 자리에
//  틈이 보이므로 가로세로를 따로 맞춘다(비율을 비틀어서라도 정확히).
export const FLOOR_ORDER = [
  "floor_a", "floor_b", "floor_c", "rug_a",
  "rug_b", "pav_a", "pav_b", "road_a",
  "road_b", "road_dash", "mat", "lot",
];
export const FLOOR_SIZE = [32, 16];
