'use client';

/**
 * 책등 하나.
 *
 * 처음엔 책 한 권에 그림 **한 칸(세로줄 1픽셀)**만 배정했다. 그런데
 * 1픽셀 폭짜리 세로줄은 수학적으로 "색이 위아래로 바뀌는 것"밖에
 * 표현할 수가 없다 — 대각선도, 곡선도 그 안에는 못 담긴다. 그러니
 * 아무리 색을 쨍하게 하고 키워도 한 권만 떼어 보면 줄무늬로 보일
 * 수밖에 없었다. **그림처럼 보이려면 한 권이 최소한의 '폭'을 가져야
 * 한다.** 그래서 책 한 권에 그림 **세 칸(3열)**을 배정한다 — 산등성이
 * 사면, 달의 둥근 테두리 같은 대각선·곡선이 한 권 안에서도 실제로
 * 꺾이는 게 보인다.
 *
 * 그런데도 여전히 달이 네모로, 나비가 그냥 얼룩으로 보인 적이 있었다
 * — 폭(3칸)만 맞추고 **칸이 정사각형인지는 안 재봤던 것**이다. 옛날
 * 판(33행)은 `viewBox`가 3×33인데 실제 렌더 크기는 32×123px이었다 —
 * 한 칸이 가로 10.7px, 세로 3.7px로 **가로가 세로보다 3배 가까이
 * 넓었다.** `preserveAspectRatio="none"`이라 이 비율 그대로 늘어나
 * 나오니, 아무리 잘 그린 실루엣도 옆으로 짓눌려 뭉개진다 — 원이
 * 타원을 넘어 거의 직사각형으로, 고양이 윤곽은 언덕과 구분이 안 되는
 * 얼룩으로. **그래서 지금은 16행**이다 — 한 칸이 거의 정사각형이
 * 되도록 행 수를 줄이고 책 높이(`height`)를 키워 맞췄다(38×0.82÷3 ≈
 * 10.7px 폭에 맞춰 210×0.82÷16 ≈ 10.8px 높이). 내용도 부드러운
 * 곡선 실루엣 대신 **크고 뚜렷한 아이콘**으로 다시 그렸다 — 정사각형
 * 칸 + 굵은 실루엣, 이 둘이 같이 있어야 "그림"으로 읽힌다.
 *
 * 첫 아이콘 판은 나비·용사를 매번 새로 지어냈다 — 그러다 정작 나비는
 * **이미 lib/sprite.ts에 그려져 있다는 걸 잊었다**("너 나비 몰라?").
 * 용사도 마찬가지로 BODY_GRID가 있다. 남이 이미 맞춰 놓은 귀 간격,
 * 눈코 위치, 다리 비율을 무시하고 새로 그리니 나비가 나비 같지 않을
 * 수밖에 없었다. **지금은 그 두 그리드를 그대로 오려 쓴다** — BODY는
 * 머리·몸통·다리가 있는 14행짜리 뭉치를 통짜로 밝게 채워 용사로
 * (스스로 빛나니 눈·코 색 구분이 필요 없다), NABI는 귀 두 개·눈 두
 * 점·코 한 점·꼬리·발까지 그대로 살려 8행으로 뽑아(`d` 톤 = NABI의
 * 'o') 나비로 쓴다. 그린 사람이 이미 두 짐승을 구분해 놨는데 다시
 * 지어낼 이유가 없다 — 실루엣이 아니라 **그 그리드**가 나비다.
 *
 * 용사(10행)가 나비(8행)보다 살짝 크다 — 동반자가 주인공을 압도하면
 * 이상하다. 1장은 나비 혼자라 "달리는 옆모습"을 따로 지었다가 — 다리를
 * 어떻게 그려도 얼룩으로 보였다. 나비는 장마다 **똑같은 정면 얼굴**
 * 이어야 나비로 읽힌다. 그 대신 1장의 녹은 크게 키웠다 — 하늘
 * 곳곳에 번진 얼룩 여러 개 + 산등성이로 뻗는 촉수. 뭉치 하나로는
 * "재앙"처럼 안 느껴진다("ㄹㅇ 재앙인 것처럼").
 *
 * 이만큼 살리려니 칸이 더 필요했다 — **16행에서 20행**으로. 정사각형
 * 비율은 그대로 유지한다(38×0.82÷3 ≈ 10.7px 폭에 맞춰
 * 260×0.82÷20 ≈ 10.66px 높이).
 *
 * 한 권씩 모으는 건데 열두 권 중 몇 권은 창을 열어도 안이 텅 비어
 * 있었다 — 인물·지형이 없는 칸(협곡 기둥 사이, 초원 빈 풀밭)은 그냥
 * 배경색뿐이었다. **어느 권도 완전히 비지 않게** 바닥선을 안 끊기게
 * 잇고, 빈 자리마다 작은 돌무더기·풀포기를 흩어 놓는다 — 주인공을
 * 가리지 않을 만큼만, 그래도 한 권 한 권이 다 "그림 조각"으로 보이게.
 *
 * 3장은 용사가 두 팔을 벌리고 머리 위에 불꽃까지 있어서 후광 쓴
 * 성화처럼 보였다("예수님처럼 보여") — 팔을 없애고 그냥 서 있는
 * 실루엣으로, 불씨도 머리 위가 아니라 손 높이 옆에 작게 둔다. 4장은
 * 점 하나뿐인 불씨라 뭘 하는 장면인지 안 읽혔다("이해가 안 가") —
 * 점이었던 불씨를 그을린 자리까지 있는 작은 모닥불로 키웠다.
 *
 * 그래도 불씨는 여전히 주황 한 톨이라 뭔지 안 보였다("불인지도
 * 모르겠어"). 두 가지를 더한다 — ① 불꽃 자체를 안쪽에 더 밝은 심이
 * 있는 진짜 불꽃 모양으로, ② (어두운 3장에 한해) **그 자리만 밝은
 * 빛웅덩이**를 바닥과 옆 기둥에 깐다. 주황 점 하나가 아니라 "여기만
 * 밝다"는 대비 자체가 불이라는 걸 말해준다.
 *
 * 몸통 실루엣만 있는 용사는 밋밋했다("너무 민둥 영웅임") — 이것도
 * 새로 그리지 않고 lib/sprite.ts의 STR_GEAR(힘 스탯 무기, 실제 검)를
 * 그대로 옆에 쥐어 준다. 날은 몸과 같은 톤이라 하나로 이어져 빛나고,
 * 날밑·자루만 어두운 톤이라 검이라는 게 갈라져 보인다. 이미 든 게
 * 있는 3장(불씨)·4장(모닥불)은 안 겹치게 그대로 둔다.
 *
 * 더 멋있게 보일 방법을 묻길래 두 가지를 더했다(사용자가 직접 고른
 * 조합) — ① **테두리 빛**: 몸 왼쪽 가장자리에 HERO보다 밝은 흰 테두리
 * (`l`)를 한 줄 둘러 빛이 새어 나오는 쪽을 보여준다. ② **망토**: 검·
 * 불씨로 양옆이 이미 찬 2·5장은 그대로 두고, 비어 있는 3·4장에만
 * 걸쳐 준다. 처음엔 몸과 같은 톤(u)으로 그렸다가 어깨에 붙은 혹처럼
 * 보여서 — 테두리 톤(r/R)으로 갈라 옷감이라는 게 보이게 고쳤다.
 *
 * 그러다 4장이 아예 안 보인다는 얘기가 나왔다("아예 못 알아보겠어") —
 * 빈 권 채우려고 풀포기를 8개나 흩어 놨더니 용사가 그 점 무더기에
 * 파묻힌 거였다. 풀포기를 4개로 줄이고, **인물·소품을 먼저 그린 뒤
 * 바닥은 빈 칸에만** 깔도록 순서도 고쳤다 — 순서가 반대였을 땐 바닥
 * 채우기가 발밑 픽셀을 덮어써 발이 잘려 보이는 문제도 같이 있었다.
 *
 * 그래도 두 가지가 더 걸렸다("얼굴이 없잖아", "초원인지도 모르겠어
 * 브라운이니까"). ① 용사가 통짜 실루엣이라 무슨 표정도 없었다 —
 * NABI가 눈 자리에 짙은 점을 찍는 것과 같은 수법으로, 머리에 점 두
 * 개(`d`)만 찍는다. ② 4장 바닥은 갈빛(H/R)만 썼더니 초원이 아니라
 * 그냥 흙바닥으로 보였다 — 이 장에 한해 초록 톤(e/E)을 새로 쓴다.
 * 고양이는 초록·파랑은 잘 보고 빨강·보라만 흐리게 보니("나비는
 * 고양이라 빨강·보라 계열을 흐리게 본다") 이 규칙에 어긋나지 않는다.
 *
 * 그래서 무릎을 굽힌 **앉은 자세**까지 만들어 봤는데 — 다리 사이가
 * 두 뭉치로 갈라져서 앉은 게 아니라 기어가는 것처럼 보였다("기어
 * 다니고 있는데 이게 맞아"). 발밑에 바위 받침까지 깔아 봤지만 그래도
 * 모호했다("너무 모호해서 앉았다고 판단조차 안 돼"). **자세로
 * "쉰다"를 증명하려던 게 애초에 무리수였다** — 이 해상도에서는
 * 서 있다/앉아 있다를 실루엣만으로 가르기 어렵다. 자세는 포기하고
 * 다른 장에서 이미 잘 읽히는 **서 있는 실루엣**을 그대로 쓴다. 대신
 * "밝아진 세상"은 자세가 아니라 **배경**으로 보여준다 — 산도 협곡도
 * 아닌 트인 들판에, 밤 장면(1장)의 달과 짝을 이루는 낮의 해를 하늘에
 * 띄운다.
 *
 * 표정도 4·5장만 웃는 얼굴로 바꿨다 — 눈 자리는 그대로 두고 그
 * 아래 한 줄에 입을 더한 `heroGlyphHappy`. 위기가 지나 밝아진
 * 두 장(4·5)만 웃고, 아직 녹과 마주한 2·3장은 무표정 그대로다.
 *
 * 4장에 꽃도 더했다 — 풀밭에 별(s) 톤 꽃송이 몇 송이, 그리고 하늘
 * 전체에 걸쳐 성기게 뿌린 꽃잎("꽃비 같은 거 좀만 더"). 빨강·보라를
 * 안 쓰니 색 규칙에도 어긋나지 않는다.
 *
 * 4장이 밝아지니(해·꽃비) 상대적으로 5장이 어두워 보였다("5장도
 * 조금 더 밝게") — 달을 띄운다(1장의 밤과 짝을 이루며 하루가
 * 저무는 걸 보여준다), 반짝임도 2개에서 10개로 늘리고, 집 창문에도
 * 불을 하나씩 켠다.
 *
 * **한 단(열두 권)에 그림 한 장이 아니라, 다섯 장의 이야기가 돈다**
 * (Bookshelf.tsx — 한 단 = 열두 권 = 그림 한 장). 처음엔 다섯 장이
 * 전부 같은 산·같은 달 아래서 인물만 바뀌었다 — 배경이 똑같으니
 * 다섯 권을 다 모으고 싶은 마음이 안 들었다. **장소도 장마다 바뀐다.**
 * 산은 딱 1장에만 쓰고, 나머지 넷은 저마다 다른 곳이다 — 숲, 협곡,
 * 초원, 마을. 같은 이야기가 다른 곳에서 벌어지는 다섯 장면:
 *   1. **녹이 슮** — 밤 산. 나비 혼자 능선을 가로질러 녹을
 *      피해 달아난다. 아직 아무도 응답하지 않았다
 *   2. **용사의 발견** — 숲 속 빈터. 용사가 서고, 저만치 나비가
 *      웅크려 있다 — 멀찍이 떨어진 두 존재. 아직 불은 없다
 *   3. **녹을 밝히는 용사** — 협곡의 바위 사이. 용사 혼자, 두 팔을 들어
 *      불씨를 켠다. 녹은 베어 없앨 수 없으니(docs/LORE.md "녹을
 *      만드는 용사가 곧 괴물인가"), 칼이 아니라 빛으로 마주 선다
 *   4. **밝아진 세상** — 볕 드는 초원. 산도 협곡도 아닌, 트인 곳에
 *      해가 떴다. 용사는 잦아든 불씨 곁에 서 있다
 *   5. **나비와 용사** — 집 두 채 사이 마당. 나란히 앉아 불씨를
 *      사이에 두고. 다섯째 해가 끝나면 이야기는 처음(1)으로
 *      되돌아간다 — 녹은 완전히 사라지지 않는다는 것도 이미
 *      정리해 둔 그대로다(docs/LORE.md "위험은 정말 없는가")
 *
 * **나비는 고양이라 빨강·보라 계열을 흐리게 본다** — 그래서 색을 칠한
 * 그림이 아니라 가죽에 금박을 입힌 음각 삽화로 그린다.
 */
const COLS_PER_BOOK = 3;
const BOOKS_PER_CHAPTER = 12;
const MURAL_COLS = COLS_PER_BOOK * BOOKS_PER_CHAPTER;

/** 공통 배경(산·달·별)에 국·불씨·녹·나비를 켜고 끄는 식으로 다섯 장을 만든다 */
const MURAL_CHAPTERS: readonly (readonly string[])[] = [
  // ch1
  [
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '..s..mm.........s.....vv.....vv.....',
    '....mmmm...........v..vv....vwwv....',
    '....mmmm..........vwv......vwwwwv...',
    '.....mm............v.......vwwwwv...',
    '............................vwwv....',
    '........................vv...v.v....',
    '........................vv....v.....',
    '.............nn......nn.............',
    '.............nnnnnnnnnn.......vv....',
    '.............nndnnnndnn.......vv....',
    '.............nnnnddnnnn.............',
    '..............nnnnnnnn..............',
    '........rrr...nnnnnnnn.n............',
    '.......rhhhr..nnnnnnnnnn..rrr.......',
    '......rhhhhhr.ddd..ddd...rhhhr......',
    '.r...rhhhhhhhr..........rhhhhhr...r.',
    'rhr.rhhhhhhhhhr........rhhhhhhhr.rhr',
    'rrrrhhhhhhhhhhhrrrrrrrrhhhhhhhhhrrrr',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ],
  // ch2
  [
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '...s...........................s....',
    '..................s.................',
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '....................................',
    '............luuuuu..................',
    '.......u...lluuuuuu.................',
    '.......u...luuuuuuu.................',
    '.......u...luduuduu.................',
    '.......u...luuuuuuu.................',
    '..h....u...luuuuuuu..............h..',
    '.hhh...u..lluuuuuuuu.nn......nn.hhh.',
    '.hhh...u...luuuuuuu..nnnnnnnnnn.hhh.',
    '.hhh..rrr..luuuuuuu..nndnnnndnn.hhh.',
    '.hhh...r...luu..uuu..nnnnddnnnn.hhh.',
    'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ],
  // ch3
  [
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '.....s..............................',
    '.............................s......',
    '....................................',
    '.......rrr..........................',
    '.......hhh.................rrrr.....',
    '.......hhh.................hhhh.....',
    '.......hhh.................hhhh.....',
    '.......hhh.....luuuuu......hhhh.....',
    '.rrrr..hhh....lluuuuuu.....hhhh.....',
    '.hhhh..hhh....luuuuuuu.....hhhh.....',
    '.hhhh..hhh.rr.luduuduu.....hhhh.....',
    '.hhhh..hhhrrr.luuuuuuu.....hhhh..rr.',
    '.hhhh..hhhrrr.luuuuuuu..f..hhhh..hh.',
    '.hhhh..hhh.r.lluuuuuuuufyf.hhhh..hh.',
    '.hhhh..hhg....luuuuuuu.fff.ghhh..hh.',
    '.hhhh..hhg....luuuuuuu..f..ghhh..hh.',
    '.hhhh..hhg....luu..uuu.....ghhh..hh.',
    'hhhhhhhhhhhggggggggggggggggghhhhhhhh',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ],
  // ch4
  [
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '......mm........................s...',
    '.....mmmm..........s................',
    '.....mmmm...s.......................',
    '......mm.....................s......',
    '..s.................................',
    '......................s.............',
    '.........s..........................',
    '..................luuuuu.......s....',
    '...............s.lluuuuuu...........',
    '....s............luuuuuuu...........',
    '..............RR.luduuduu.s.........',
    '..........s..RRR.lu.dd.uu...........',
    '.............RRR.luuuuuuu...........',
    '..E.....E.....R.lluuuuuuuu.....E..E.',
    '.EEE.s.EEE.s.....luuuuuuu...y.EEEEEE',
    '.E.EsssE.Esss....luuuuuuu.sfffE.EE.E',
    'E..E.eE..E.eE..E.luu.Euuu.edddE..E..',
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ],
  // ch5
  [
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '....s............mm............s....',
    '................mmmms...............',
    '.........s......mmmm................',
    '.................mm.......s.........',
    '....................................',
    '.............s......................',
    '.......................s............',
    '.............................s......',
    '...s........luuuuu..................',
    '........u..lluuuuuu.................',
    '...RR...u..luuuuuuu..nn......nn..RR.',
    '..RRRR.su..luduuduu..nnnnnnnnnn.RRRR',
    '..Hy.H..u..lu.dd.uu..nndnnnndnn.Hy.H',
    '..HHHH..u..luuuuuuu..nnnnddnnnn.HHHH',
    '..HHHH..u.lluuuuuuuu..nnnnnnnn..HHHH',
    '.R......u..luuuuuuu.f.nnnnnnnn.n....',
    'RRR....rrr.luuuuuuu.y.nnnnnnnnnn....',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ],
];
const MURAL_ROWS = MURAL_CHAPTERS[0].length;
if (process.env.NODE_ENV !== 'production') {
  MURAL_CHAPTERS.forEach((chapter, ci) => {
    if (chapter.length !== MURAL_ROWS) {
      throw new Error(`BookSpine chapter ${ci} has ${chapter.length} rows, expected ${MURAL_ROWS}`);
    }
    const bad = chapter.findIndex((row) => row.length !== MURAL_COLS);
    if (bad !== -1) {
      throw new Error(`BookSpine chapter ${ci} row ${bad} isn't ${MURAL_COLS} cols wide`);
    }
  });
}

const LEATHER = '#3c2a1d';
const BORDER = '#e0b84a';
const MOON = '#e8c34a';
const STAR = '#fff3c4';
const FLAME = '#ff9838';
/** 불씨 심지 — 주황 한 톨로는 불인지 안 보였다. 안쪽에 더 밝은 심을 하나 더 */
const FLAME_CORE = '#ffe27a';
/** 불씨가 닿는 자리만 밝힌다 — 어두운 협곡 속 이 자리만 도드라지는 빛웅덩이 */
const GLOW = '#c9793a';
/** 용사 — 달보다 밝다. 빛을 반사하는 게 아니라 스스로 낸다는 뜻 */
const HERO = '#fef6d8';
/** 몸 왼쪽 가장자리를 두르는 빛 테두리 — HERO보다도 밝아 빛이 새어 나오는 쪽을 표시한다 */
const HERO_RIM = '#ffffff';
/** 어두운 배경(1~3장 — 밤 산·숲·협곡) */
const SILHOUETTE = '#150f0a';
const RIM = '#8a6f4f';
/** 밝은 배경(5장 — 마을) */
const BRIGHT_SILHOUETTE = '#6b4a30';
const BRIGHT_RIM = '#c9a06a';
/** 4장 전용 — 초원인데 갈빛만 쓰니 흙바닥으로 보였다. 이 장만 초록 톤 */
const GRASS = '#5c6b34';
const GRASS_LIGHT = '#96a85a';
/** 녹의 존재 자체 — 산의 그늘과는 다른, 차가운 회보라. 짙은 몸통 */
const SHADOW_BEING = '#241c33';
/** 녹 몸통의 밝은 쪽 테두리 — 산의 r과 같은 역할, 뭉치가 아니라 형체로 보이게 */
const SHADOW_RIM = '#5c4d7a';
/** 나비 — 용사·불씨와는 다른, 따뜻한 갈빛 한 톨 */
const NABI = '#d9a86c';
/** 나비의 눈·코·발 — lib/sprite.ts NABI가 쓰는 'o' 그대로, 털보다 짙은 톤 */
const NABI_DARK = '#6b4a30';
const MURAL_PALETTE: Record<string, string> = {
  b: BORDER,
  m: MOON,
  s: STAR,
  f: FLAME,
  u: HERO,
  h: SILHOUETTE,
  r: RIM,
  H: BRIGHT_SILHOUETTE,
  R: BRIGHT_RIM,
  e: GRASS,
  E: GRASS_LIGHT,
  w: SHADOW_BEING,
  v: SHADOW_RIM,
  n: NABI,
  d: NABI_DARK,
  y: FLAME_CORE,
  g: GLOW,
  l: HERO_RIM,
};

export const SPINE_W = 38;

/** 이 책이 다섯 장 중 몇 번째 장을 보여줄지 — 열두 권(한 단)마다 다음 장, 다섯 장을 다 돌면 처음으로 */
export function chapterIndexFor(volume: number): number {
  const chapterNumber = Math.floor((volume - 1) / BOOKS_PER_CHAPTER);
  return chapterNumber % MURAL_CHAPTERS.length;
}

/**
 * 책장 옆 여백 — 책 열두 권이 다 차도 나무 판 옆으로 늘 빈 자리가
 * 남았다("옆에 너무 많이 남는데"). 그 자리에 지금 보고 있는 단이
 * 다섯 장 중 몇 번째 이야기인지 짧게 적어 둔다 — 그림만으론 안
 * 보이던 이야기를 처음으로 플레이어에게 보여주는 자리다.
 */
export const MURAL_CHAPTER_STORY: readonly { title: string; blurb: string }[] = [
  {
    title: '녹이 슮',
    blurb:
      '용사님, 드릴 말씀이 있습니다. 아무도 모르는 사이에 녹이 슬었더군요. 누가 만든 것도, 딱히 이유가 있는 것도 아니었습니다 — 그저 하루하루가 무심히 흘러가다 보면 어느새 낡음이 짙어지는 법이니까요. 저 혼자 그 기척을 알아채고, 능선을 가로질러 달아났습니다. 아직은 아무도 그 부름에 응답하지 않았습니다.',
  },
  {
    title: '용사의 발견',
    blurb:
      '숲 속 빈터에서, 저와 용사님이 처음 마주쳤던 날을 기억합니다. 저는 녹을 피해 잔뜩 웅크리고 있었고, 용사님은 이제 막 하루를 시작하신 참이었죠. 서로 잘 모르니 거리를 두고 지켜볼 뿐, 다가가지도 물러서지도 않았습니다. 불씨는 아직 켜지지 않았지만, 그 만남 자체가 이미 시작이었습니다.',
  },
  {
    title: '녹을 밝히는 용사',
    blurb:
      '협곡의 차가운 바위 틈 사이에서, 용사님은 마침내 손을 들어 작은 불씨를 밝히셨습니다. 녹은 칼로 벨 수 있는 게 아니었으니까요 — 대신 빛으로 마주 서기로 하셨죠. 크지 않아도 괜찮았습니다, 그저 꾸준히 하루도 거르지 않고 밝혀 오신 불씨였으니까요. 그 작은 빛 하나가 녹이 발 붙일 자리를 조금씩 밀어냈습니다.',
  },
  {
    title: '밝아진 세상',
    blurb:
      '산도 협곡도 아닌, 탁 트인 들판에 볕이 들었습니다. 밤사이 슬었던 녹은 잠시 옅어졌고, 하늘엔 해가 떠서 온 세상을 환하게 비췄죠. 용사님은 이제 잦아든 불씨 곁에 서서 지나온 길을 가만히 돌아보셨습니다. 꽃잎이 바람에 흩날리고 풀밭엔 작은 꽃도 피어났습니다. 위기는 지나갔지만 완전히 사라진 건 아니라는 것도, 이미 알고 계셨죠.',
  },
  {
    title: '나비와 용사',
    blurb:
      '집 두 채 사이, 아늑한 마당에 밤이 내렸습니다. 저와 용사님은 나란히 앉아 그 사이에 작은 불씨를 두었습니다. 창문마다 따뜻한 불빛이 하나씩 켜지고, 하늘엔 달과 별이 가득했죠. 어쩌면 녹은 다시 슬지도 모릅니다. 하지만 용사님의 이야기는, 계속되겠죠.',
  },
];

/** 그 장 안에서 몇 번째 '세 칸짜리 창'을 보여줄지(0~11) */
function windowStartFor(volume: number): number {
  const positionInChapter = (volume - 1) % BOOKS_PER_CHAPTER;
  return positionInChapter * COLS_PER_BOOK;
}

/** 세 칸짜리 창만 잘라 그린다 */
function MuralSlice({ volume, height }: { volume: number; height: number }) {
  const mural = MURAL_CHAPTERS[chapterIndexFor(volume)];
  const start = windowStartFor(volume);
  return (
    <svg
      viewBox={`0 0 ${COLS_PER_BOOK} ${MURAL_ROWS}`}
      width={SPINE_W - 6}
      height={height}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      role="img"
      aria-hidden
    >
      {mural.map((row, y) =>
        Array.from({ length: COLS_PER_BOOK }, (_, x) => {
          const fill = MURAL_PALETTE[row[start + x]];
          if (!fill) return null;
          return <rect key={`${y}-${x}`} x={x} y={y} width={1} height={1} fill={fill} />;
        }),
      )}
    </svg>
  );
}

export function BookSpine({
  volume,
  height = 260,
}: {
  volume: number;
  height?: number;
}) {
  const muralH = Math.round(height * 0.82);

  return (
    <span
      className="press flex flex-col items-center border-2 shadow-pixel-sm"
      style={{ width: SPINE_W, height, borderColor: BORDER, backgroundColor: LEATHER }}
    >
      <span className="mt-1">
        <MuralSlice volume={volume} height={muralH} />
      </span>

      <span
        className="mt-auto mb-1 border-t border-[#8a6d1f] pt-0.5 font-display text-[10px] leading-none"
        style={{ color: BORDER }}
      >
        {volume}
      </span>
    </span>
  );
}
