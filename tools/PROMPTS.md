# 시트 생성 프롬프트 기준표

새 테마를 만들 때 이 파일을 복사해 `<THEME>` 부분만 바꿔 쓴다.
**프롬프트를 여기 적지 않고 채팅에서만 쓰면 다음 세션이 다시 처음부터 시행착오를 한다.**

## 파일 이름과 위치 (pack-build가 이 이름으로 찾는다)

테마 하나 = 시트 **10장**. 전부 `assets/raw/sheets/` 아래.

```
theme_<THEME>_hall.png       기물 12칸  (4열 × 3행)
theme_<THEME>_bar.png        기물 12칸  (4열 × 3행)
theme_<THEME>_decor.png      기물 12칸  (4열 × 3행)
theme_<THEME>_outdoor.png    기물 12칸  (4열 × 3행)
cast/<THEME>.png             인물 24칸  (4열 × 6행)  ← 이것만 24칸이다
back/<THEME>.png             뒷모습 12칸 (4열 × 3행)
staffmo/<THEME>.png          직원 동작 12칸 (4열 × 3행)
seat/<THEME>.png             좌석 앞뒤 12칸 (4열 × 3행)
wall/<THEME>.png             벽 조각 12칸 (4열 × 3행)
floor/<THEME>.png            바닥 타일 12칸 (4열 × 3행)
```

`tools/pack-spec.mjs`의 `THEMES` 배열에 테마 이름을 넣어야 pack-build가 돈다.
굽기: `node tools/pack-build.mjs --write` (THEMES 전부를 돈다)
확인: `node tools/scene2d-preview.mjs 6 0.8`

## 칸 순서 (읽는 순서 = 왼쪽→오른쪽, 위→아래)

| 시트 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hall | 6인 테이블 | 8인 테이블 | 의자 | 딜러 의자 | 스툴 | 소파 | 안락의자 | 라운지 테이블 | 사각 러그 | 원형 러그 | 사이드 테이블 | 칸막이 |
| bar | 직선 바 | 코너 바 | 백바 선반 | 생맥주 탭 | 냉장고 | 싱크 | 카트 | 커피머신 | 술장 | 쟁반 | 스낵 | 금고 |
| decor | 펜던트등 | 샹들리에 | 벽등 | 큰 액자 | 작은 액자 | 메뉴보드 | 네온사인 | 다트판 | 주크박스 | 시계 | 트로피장 | 야자수 |
| outdoor | 문 | 입간판 | 폴대 | 옷걸이 | 안내 데스크 | 가로등 | 나무 | 관목 | 벤치 | 화단 | 쓰레기통 | 택시 |
| back | 걷기뒤1 | 걷기뒤2 | 걷기뒤3 | 걷기뒤4 | A서기뒤 | A앉기뒤 | B서기뒤 | B앉기뒤 | C서기뒤 | C앉기뒤 | 딜러뒤 | 서빙뒤 |
| staffmo | 서빙걷기앞1 | 앞2 | 앞3 | 앞4 | 서빙걷기뒤1 | 뒤2 | 뒤3 | 뒤4 | 딜러대기 | 딜러딜링 | 바텐더대기 | 바텐더따르기 |
| seat | 의자앞 | 의자뒤 | 딜러의자앞 | 딜러의자뒤 | 안락의자앞 | 안락의자뒤 | 소파앞 | 소파뒤 | 벤치앞 | 벤치뒤 | 스툴2 | 라운지테이블2 |

**cast 시트만 4열 × 6행 = 24칸**이다. 순서는 `tools/pack-spec.mjs`의 `CAST` 배열:

| 행 | 1열 | 2열 | 3열 | 4열 |
|---|---|---|---|---|
| 1 | 손님A 걷기앞1 | 앞2 | 앞3 | 앞4 |
| 2 | 손님A 걷기뒤1 | 뒤2 | 뒤3 | 뒤4 |
| 3 | 손님A 서기앞 | 손님A 앉기앞 | 손님A 서기뒤 | 손님A 앉기뒤 |
| 4 | 손님B 서기앞 | 손님B 앉기앞 | 손님B 서기뒤 | 손님B 앉기뒤 |
| 5 | 손님C 서기앞 | 손님C 앉기앞 | 손님C 서기뒤 | 손님C 앉기뒤 |
| 6 | 딜러 서기 | 딜러 딜링 | 서빙 서기 | 서빙 쟁반 |

보행은 4프레임 사이클 × 앞/뒤 = 8칸이고, 아이소 4방향은 코드가 좌우반전해서 만든다.
**배율은 "서 있는 칸 하나"에서 구해 24칸 전부에 일괄 적용된다** — 한 시트 안의 모든
인물이 같은 배율로 그려져 있어야 하는 이유다.

### 벽 조각 (wall) · 바닥 타일 (floor)

| 시트 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| wall | 북쪽 민벽 | 서쪽 민벽 | 북쪽 징두리 | 서쪽 징두리 | 북쪽 문 | 서쪽 문 | 북쪽 창 | 서쪽 창 | 모서리 기둥 | 기둥 | 북쪽 허리벽 | 서쪽 허리벽 |
| floor | 바닥A | 바닥B | 강조바닥 | 카펫A | 카펫B | 보도A | 보도B | 도로A | 도로B | 중앙선 | 매트 | 공터 |

**픽셀 치수를 프롬프트에 그대로 적는다** (S=1 원본 기준, 화면에는 ×2):

| | 계산 | 값 |
|---|---|---|
| 벽 조각 가로 | 타일 한 칸 = TW/2 | 16px |
| 바닥선 하강 | TH/2 | 8px — 기울기 정확히 **1:2** |
| 벽 높이 | WALL_H/S | 76px |
| 벽 조각 전체 | 16 × (76+8) | **16 × 84** |
| 허리벽(앞벽) | FRONT_H/S + 8 | 16 × 38 |
| 바닥 타일 | 타일 그대로 | **32 × 16** |

벽 조각에 반드시 박는 문장 — **이 한 줄이 전부를 가른다**:

```
THE PANELS MUST TILE SEAMLESSLY SIDE BY SIDE. The LEFT and RIGHT edges carry NO border,
NO frame, NO post, NO outline and NO shading change. The wall surface runs straight off
both edges so copies placed next to each other read as ONE CONTINUOUS WALL. Do not cap
the ends. Do not draw the side thickness. Only the TOP edge carries a cap or moulding,
and that cap also runs off both side edges.
```

북쪽/서쪽을 **따로 뽑는다**. 좌우반전으로 만들면 빨라 보이지만 좌상단 광원이 같이
뒤집혀 두 벽의 명암이 거꾸로 된다. 북쪽이 밝고 서쪽이 15% 어둡다.

바닥 타일에 반드시 박는 문장:

```
THE 12 TILES MUST BE COMPLETELY SEPARATED. Leave a WIDE band of solid MAGENTA between
every tile, at least half a tile on all four sides. No tile may touch, overlap or share
a corner with another. A plain evenly spaced 4 by 3 grid, not offset or staggered.
DRAW EACH TILE PERFECTLY FLAT. No thickness, no side faces, no rim, no shadow underneath.
```

**그래도 안 지킬 것을 전제로 굽는다.** 실제로 셋 다 어겼고, 전부 코드에서 흡수했다:
- 기울기가 1:2가 아니어도 된다 — `fitSlab`이 열마다 위·아래 끝을 찾아 계산된 자리로
  늘려 **기울기를 강제한다**. 모델의 명암·질감은 살고 실루엣만 격자에 맞는다.
- 타일에 두께를 그려도 된다 — `fitTile`이 **가장 넓은 행**(마름모의 긴 대각선)을 찾아
  위아래로 폭의 1/4씩만 잘라 쓴다.
- 타일이 꼭짓점으로 맞물려도 된다 — 바닥 시트는 성분 찾기를 건너뛰고 균등 격자로 나눈다.

## 모든 시트에 공통으로 박는 문장

개수와 열 수를 문장 **맨 앞**에 STRICT로 못박는다. 뒤쪽에 적으면 지키지 않는다.

```
STRICT: EXACTLY 12 items in EXACTLY 4 columns x 3 rows. Not 18 items, not 6 columns.
Isometric dimetric 2:1 projection, pure orthographic, zero perspective warp.
Pixel art, 3 tone shading per surface (base / shadow / highlight), hard dark outline,
light source from the upper left. ONE object per cell — do not draw chairs, cushions,
chips or any extra props around an object.
Solid MAGENTA (#FF00FF) background, no grid lines, no drop shadows, no labels or text.
```

### 왜 이 문장들인가 (전부 값을 치르고 얻은 것)
- **개수·열수를 앞에 STRICT로**: 12개를 요구해도 6열 18개로 그려 오고, 절반 해상도로
  나와 조각이 붙는다.
- **한 칸에 하나**: 테이블 칸에 스툴을 붙여 그려 와서 배치 단계에서 의자가 중복됐다.
- **마젠타 배경**: 흰 배경은 물건 안쪽 흰색까지 같이 날아간다. 다만 모델이 **탁한
  분홍**을 배경으로 쓰는 일이 있다(공주풍 벽 시트가 그랬다) — 키잉 기준은 고정값이
  아니라 시트 테두리에서 채도·명도를 재서 정한다.
- **격자선 금지**: 칸 사이에 검은 선을 그으면 12개가 한 덩어리로 붙는다.
  (`stripGridLines`가 지우긴 하지만 안 그리는 게 낫다)
- **글씨 금지**: 간판 글씨는 생성에 맡기지 않고 `PixelFont`로 코드에서 찍는다.

## 인물 시트에 추가로 박는 문장

```
2-head-tall chibi proportions. VISIBLE HAIR with a distinct hair color (not bald).
All characters drawn at ONE consistent scale within the sheet — do not resize per pose.
Walk cycle frames must read as a cycle: contact / passing-down / contact / passing-up.
```

뒷모습(back) 시트는 여기에 더한다:

```
BACK VIEW only. Hair must be clearly LIGHTER than the clothing, with a visible nape line
and angled shoulders — at 28 pixels tall a same-color head and coat read as one brown blob.
```

## 테마 문장 (분위기만, 고유명사 금지)

작품명·스튜디오·캐릭터 이름을 절대 넣지 않는다. 분위기로 풀어 쓴다.

| 테마 | 문장 |
|---|---|
| classic | warm wood and brass, green felt, amber pendant lights |
| japanese | night-time traditional inn: dark zen wood, sakura-patterned felt, shoji lattice, paper lanterns |
| kabukicho | modern Japanese neon nightlife: black lacquer and dark zen wood, deep red felt with gold sakura, shoji lattice backlit magenta and violet, izakaya paper lanterns over chrome |
| neon | cyberpunk night bar: magenta and cyan neon, black gloss, chrome |
| european | renaissance cathedral mood: stone arches, deep burgundy, gold leaf |
| princess | pastel pink and cream, white lace, gold trim |

## 생성

- 모델 **nano_banana_2** = 2 크레딧/장. 한 테마 10장 = 20 크레딧(재시도 포함 24~40).
- 4열×3행 시트는 `aspect_ratio: "4:3"`, cast 시트(4열×6행)는 `"2:3"`,
  벽 시트는 세로로 긴 조각이라 `"9:16"`, 바닥 시트는 가로로 넓어 `"16:9"`. 해상도 `2k`.
- **동시 제출은 6장쯤에서 429**가 난다. 나눠 던진다.
- 크레딧을 쓰기 전에 항상 먼저 묻는다: 이게 생성 문제인가, 굽기/렌더러 문제인가.
  크기 불일치와 방향 문제는 지금까지 전부 후자였다.
