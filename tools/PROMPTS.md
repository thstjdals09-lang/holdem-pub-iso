# 시트 생성 프롬프트 기준표

새 테마를 만들 때 이 파일을 복사해 `<THEME>` 부분만 바꿔 쓴다.
**프롬프트를 여기 적지 않고 채팅에서만 쓰면 다음 세션이 다시 처음부터 시행착오를 한다.**

## 파일 이름과 위치 (pack-build가 이 이름으로 찾는다)

```
assets/raw/sheets/theme_<THEME>_hall.png        기물 12칸 (4열 × 3행)
assets/raw/sheets/theme_<THEME>_bar.png         기물 12칸
assets/raw/sheets/theme_<THEME>_decor.png       기물 12칸
assets/raw/sheets/theme_<THEME>_outdoor.png     기물 12칸
assets/raw/sheets/cast_<THEME>_stand.png        인물 12칸
assets/raw/sheets/cast_<THEME>_sit.png          인물 12칸
assets/raw/sheets/back/<THEME>.png              뒷모습 12칸
```

구우려면: `node tools/pack-build.mjs <THEME> --write`
확인하려면: `node tools/scene2d-preview.mjs 6 0.8`

## 칸 순서 (읽는 순서 = 왼쪽→오른쪽, 위→아래)

| 시트 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| hall | 6인 테이블 | 8인 테이블 | 의자 | 딜러 의자 | 스툴 | 소파 | 안락의자 | 라운지 테이블 | 사각 러그 | 원형 러그 | 사이드 테이블 | 칸막이 |
| bar | 직선 바 | 코너 바 | 백바 선반 | 생맥주 탭 | 냉장고 | 싱크 | 카트 | 커피머신 | 술장 | 쟁반 | 스낵 | 금고 |
| decor | 펜던트등 | 샹들리에 | 벽등 | 큰 액자 | 작은 액자 | 메뉴보드 | 네온사인 | 다트판 | 주크박스 | 시계 | 트로피장 | 야자수 |
| outdoor | 문 | 입간판 | 폴대 | 옷걸이 | 안내 데스크 | 가로등 | 나무 | 관목 | 벤치 | 화단 | 쓰레기통 | 택시 |

인물 시트는 `tools/pack-spec.mjs`의 `CAST` 배열이 순서의 기준이다 (24칸 = stand 12 + sit 12).
보행은 4프레임 사이클 × 앞/뒤 = 8칸이고, 아이소 4방향은 코드가 좌우반전해서 만든다.

## 모든 시트에 공통으로 박는 문장

문장 **맨 앞**에 개수와 열 수를 STRICT로 못박는다. 뒤쪽에 적으면 지키지 않는다.

```
STRICT: EXACTLY 12 items, arranged in EXACTLY 4 columns × 3 rows. Not 18, not 6 columns.
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
- **마젠타 배경**: 흰 배경은 물건 안쪽 흰색까지 같이 날아간다.
- **격자선 금지**: 칸 사이에 검은 선을 그으면 12개가 한 덩어리로 붙는다.
  (`stripGridLines`가 지우긴 하지만 안 그리는 게 낫다)
- **글씨 금지**: 간판 글씨는 생성에 맡기지 않고 `PixelFont`로 코드에서 찍는다.

## 인물 시트에 추가로 박는 문장

```
2-head-tall chibi proportions. VISIBLE HAIR with a distinct hair color (not bald).
All characters drawn at ONE consistent scale within the sheet — do not resize per pose.
Walk cycle frames must read as a cycle: contact / passing-down / contact / passing-up.
```

뒷모습 시트는 여기에 더한다:

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
| neon | cyberpunk night bar: magenta and cyan neon, black gloss, chrome |
| european | renaissance cathedral mood: stone arches, deep burgundy, gold leaf |
| princess | pastel pink and cream, white lace, gold trim |

## 생성

- 모델 **Nano Banana 2** = 2 크레딧/장. 한 테마 7장 ≈ 14 크레딧(재시도 포함 20~30).
- **동시 제출은 6장쯤에서 429**가 난다. 나눠 던진다.
- 크레딧을 쓰기 전에 항상 먼저 묻는다: 이게 생성 문제인가, 굽기/렌더러 문제인가.
  크기 불일치와 방향 문제는 지금까지 전부 후자였다.
