import {
  BEHIND_SHAPES,
  COSMETIC_SHAPES,
  cosmeticPalette,
  remapForSlot,
  type CosmeticArt,
} from './cosmetics';
import type { Category, Stats } from './quest';

/**
 * 픽셀 캐릭터는 이미지가 아니라 데이터다.
 * 16x16 문자 그리드 + 팔레트로 정의해서 SVG <rect>로 그린다.
 * 외부 에셋이 없으니 능력치에 따라 팔레트를 갈아끼우는 게 공짜다.
 *
 *   . 투명   o 외곽선   s 피부   h 머리   c 옷   d 옷(그늘)   a 장비 강조
 */
export type Grid = readonly string[];
export type Palette = Record<string, string>;

export const SPRITE_SIZE = 16;

const BODY: Grid = [
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '....ohhhhhho....',
  '....ohssssho....',
  '....osossoso....',
  '....osssssso....',
  '....ossoosso....',
  '....oooooooo....',
  '...occcccccco...',
  '...osccccccso...',
  '...ooccccccoo...',
  '....oddddddo....',
  '....oddooddo....',
  '....ooo..ooo....',
  '................',
];

const STR_GEAR: Grid = [
  '................',
  '................',
  '................',
  '..a.............',
  '..a.............',
  '..a.............',
  '..a.............',
  '..a.............',
  '..a.............',
  '..a.............',
  '.ooo............',
  '..o.............',
  '................',
  '................',
  '................',
  '................',
];

const INT_GEAR: Grid = [
  '................',
  '................',
  '................',
  '.aaa............',
  '.aaa............',
  '..o.............',
  '..o.............',
  '..o.............',
  '..o.............',
  '..o.............',
  '..o.............',
  '..o.............',
  '................',
  '................',
  '................',
  '................',
];

const CHA_GEAR: Grid = [
  '................',
  '................',
  '................',
  '................',
  '..o.............',
  '..o.............',
  '..o.............',
  '..o.............',
  '..o.............',
  '.aaa............',
  '.aoa............',
  '.aaa............',
  '................',
  '................',
  '................',
  '................',
];

const VIT_GEAR: Grid = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..o.............',
  '.ooo............',
  '.oao............',
  '.oao............',
  '.ooo............',
  '................',
  '................',
  '................',
  '................',
];

const LUK_GEAR: Grid = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.aaa............',
  '.aoa............',
  '.aaa............',
  '................',
  '................',
  '................',
  '................',
];
const INK = '#2E2A24';
const SKIN = '#F2C79A';

export interface CharacterClass {
  key: Category | 'NONE';
  name: string;
  gear: Grid;
  palette: Palette;
}

export const CLASSES: Record<Category | 'NONE', CharacterClass> = {
  NONE: {
    key: 'NONE',
    name: '견습생',
    gear: BODY.map(() => '................'),
    palette: { o: INK, s: SKIN, h: '#6B6154', c: '#A79B87', d: '#6B6154', a: '#B45309' },
  },
  STR: {
    key: 'STR',
    name: '전사',
    gear: STR_GEAR,
    palette: { o: INK, s: SKIN, h: '#7C2D12', c: '#9F1239', d: '#6B0F26', a: '#C8CDD6' },
  },
  INT: {
    key: 'INT',
    name: '현자',
    gear: INT_GEAR,
    palette: { o: INK, s: SKIN, h: '#4B5563', c: '#1E40AF', d: '#152C7A', a: '#7DD3FC' },
  },
  CHA: {
    key: 'CHA',
    name: '음유시인',
    gear: CHA_GEAR,
    palette: { o: INK, s: SKIN, h: '#92400E', c: '#5B21B6', d: '#3F1580', a: '#D9A05B' },
  },
  VIT: {
    key: 'VIT',
    name: '수도사',
    gear: VIT_GEAR,
    // 물약은 로브와 같은 초록이면 묻힌다 — 회복 포션의 관습대로 붉게
    palette: { o: INK, s: SKIN, h: '#3F3A32', c: '#166534', d: '#0E4021', a: '#F87171' },
  },
  LUK: {
    key: 'LUK',
    name: '방랑자',
    gear: LUK_GEAR,
    palette: { o: INK, s: SKIN, h: '#1F2937', c: '#854D0E', d: '#5A3308', a: '#F5C542' },
  },
};

export { BODY as BODY_GRID };

/** 나비. 이름 모를 고양이를 부르는 그 이름 — 이 세계의 안내자다 */
export const NABI: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff.f..',
  '....ffffffff.f..',
  '....ffffffff.f..',
  '....ffffffffff..',
  '....ffffffffff..',
  '....ooo..ooo....',
  '................',
];



/** 걸을 때의 옆모습.
 *
 *  옆모습이 고양이로 안 읽히는 건 늘 **비율** 탓이지 윤곽 탓이 아니다.
 *  머리만 키웠더니 외계인, 목을 세웠더니 사슴, 귀를 하나로 뒀더니 뿔 달린 짐승이 됐다.
 *  얼굴을 정면으로 돌려 붙여도 봤지만 이 쪽이 낫다. 규칙을 적어 둔다.
 *
 *  - **정면 나비와 같은 비율.** 머리 일곱 행, 몸통 다섯 행, 다리 두 행.
 *    옆모습이라고 머리를 줄이면 다른 짐승이 된다.
 *  - 귀는 정면과 똑같이 **두 개**, 2칸에서 3칸으로 벌어지며 머리로 이어진다.
 *  - **목이 보이면 고양이가 아니다.** 정수리와 등 사이는 네 행뿐이다.
 *  - 다리는 짧고 굵게 두 행, **네 다리 모두 두 칸**으로 균일하게.
 *    가느다란 한 칸 다리는 사슴이 된다.
 *  - 걸음은 보폭을 벌렸다 모았다 — A는 다리를 쭉, B는 모아 딛기.
 *  - 코는 얼굴 **안**에 둔다. 밖으로 내밀면 혹으로 보인다.
 *  - 꼬리는 엉덩이에서 세로로 잇는다. 대각선은 끊겨 보인다. */
export const NABI_SIDE_A: Grid = [
  '................',
  '.ff..ff.....ff..',
  '.fff.fff.....f..',
  'ffffffff.....ff.',
  'ffofffff......f.',
  'pfffffff......f.',
  'ffffffff......f.',
  '.ffffffffffffff.',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '.fffff..fffffff.',
  '.ff..ff..ff..ff.',
  '.oo..oo..oo..oo.',
  '................',
  '................',
];

export const NABI_SIDE_B: Grid = [
  '................',
  '.ff..ff.......f.',
  '.fff.fff......f.',
  'ffffffff......f.',
  'ffofffff......f.',
  'pfffffff......f.',
  'ffffffff......f.',
  '.ffffffffffffff.',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..fffff..fffff..',
  '..ff.ff..ff.ff..',
  '..oo.oo..oo.oo..',
  '................',
  '................',
];

/** 점프. 다리를 붙이고 꼬리를 세운다 */
/**
 * 점프는 한 장으로 안 된다. 자세 하나를 6틱 내내 띄워 두면
 * 고양이가 뻣뻣하게 미끄러지는 것으로만 보인다.
 * **웅크림 → 오름 → 내림 → 착지** 네 자세로 나눈다.
 */
export const NABI_CROUCH: Grid = [
  '................',
  '................',
  '.ff..ff.......f.',
  '.fff.fff......f.',
  'ffffffff......f.',
  'ffofffff......f.',
  'pfffffff......f.',
  'ffffffff......f.',
  '.ffffffffffffff.',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..fff....fffff..',
  '..oo.....oo.....',
  '................',
  '................',
];

/** 떠오르는 중 — 네 다리를 몸 아래로 접고 꼬리를 세운다 */
export const NABI_JUMP_UP: Grid = [
  '................',
  '.ff..ff.......f.',
  '.fff.fff......f.',
  'ffffffff......f.',
  'ffofffff......f.',
  'pfffffff......f.',
  'ffffffff......f.',
  '.ffffffffffffff.',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..fff....fffff..',
  '....oo...oo.....',
  '................',
  '................',
  '................',
];

/** 내려오는 중 — 다리를 뻗고 꼬리를 뒤로 눕힌다 */
export const NABI_JUMP_DOWN: Grid = [
  '................',
  '.ff..ff.........',
  '.fff.fff.....ff.',
  'ffffffff....ff..',
  'ffofffff...f....',
  'pfffffff..f.....',
  'ffffffff.ff.....',
  '.ffffffffffffff.',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..fff....fffff..',
  '..ff.......ff...',
  '..oo.......oo...',
  '................',
  '................',
];

/** 예전 이름 */
export const NABI_JUMP = NABI_JUMP_UP;


/** 집사의 일과 — 책 읽기.
 *
 *  책장은 "항상 움직이는" 게 아니라 **대부분 펼쳐 두고**, 가끔만 넘긴다.
 *  16칸에서는 장 전체를 뒤집으면 번쩍여서 책이 안 보인다.
 *  그래서 오른쪽 장이 **얇은 세로 띠**로 척추를 지나 왼쪽에 앉는 짧은
 *  세 컷만 쓰고, 나머지는 펼친 자세(A)로 고정한다.
 *
 *  A 펼쳐 읽기 → B 오른쪽 모서리만 들림 → C 척수 위 세로 띠 → D 왼쪽에 앉음. */
export const NABI_STUDY_A: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff....',
  '...bbbbbbbbbb...',
  '...bwwwbbwwwb...',
  '...bwwwbbwwwb...',
  '...bbbbbbbbbb...',
  '....ooo..ooo....',
  '................',
];

/** 오른쪽 장 모서리만 살짝 들린다 */
export const NABI_STUDY_B: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff....',
  '...bbbbbbbwwb...',
  '...bwwwbbwwfb...',
  '...bwwwbbwwwb...',
  '...bbbbbbbbbb...',
  '....ooo..ooo....',
  '................',
];

/** 장이 척추 위에서 세로 띠로 선다 */
export const NABI_STUDY_C: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff....',
  '...bbbbbwbbbb...',
  '...bwwwbwbbbb...',
  '...bwwwbwbfbb...',
  '...bbbbbbbbbb...',
  '....ooo..ooo....',
  '................',
];

/** 넘어간 장이 왼쪽 페이지에 앉는다 */
export const NABI_STUDY_D: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff....',
  '...bbbbbbbbbb...',
  '...bwwwwbwwwb...',
  '...bwwwwbwwwb...',
  '...bbbbbbbbbb...',
  '....ooo..ooo....',
  '................',
];

export const NABI_CLEAN_A: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff....',
  '....ffffffff.d..',
  '....ffffffff.d..',
  '....ffffffff.d..',
  '....ffffffffddd.',
  '....ooo..ooo.ddd',
  '................',
];

export const NABI_CLEAN_B: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff....',
  '....ffffffff..d.',
  '....ffffffff..d.',
  '....ffffffff.d..',
  '...dffffffff.dd.',
  '...ddoo..ooo....',
  '................',
];

/** 나비의 자세들. 걷기·앉기는 기본 그림을 쓰고, 나머지는 따로 그린다 */
export const NABI_DOZE: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...foofppfoof...',
  '...ffffffffff...',
  '....ffffffff....',
  '....ffffffff.f..',
  '....ffffffff.f..',
  '....ffffffff.f..',
  '....ffffffffff..',
  '....ffffffffff..',
  '....ooo..ooo....',
  '................',
];

export const NABI_SLEEP: Grid = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...ff..ff.......',
  '..ffffffffff....',
  '..foofffffff....',
  '..fffffffffff...',
  '..fffffffffffff.',
  '...fffffffff.ff.',
  '................',
  '................',
];

export const NABI_GROOM: Grid = [
  '................',
  '...ff......ff...',
  '...fff....fff...',
  '...ffffffffff...',
  '...ffffffffff...',
  '...ffoffffoff...',
  '...ffffppffff...',
  '...ffffpfffff...',
  '....ffffffff....',
  '....ffffffff.f..',
  '....ffffffff.f..',
  '....ffffffff.f..',
  '....ffffffffff..',
  '....ffffffffff..',
  '....ooo...fo....',
  '................',
];

export const NABI_STRETCH: Grid = [
  '................',
  '................',
  '................',
  '..ff......ff....',
  '..fff....fff....',
  '..ffffffffff....',
  '..foofppfoof....',
  '..ffffffffff....',
  '.fffffffffffff..',
  '.fffffffffffff..',
  '.fffffffffffff..',
  '..ffffffffff.f..',
  '..oo.....oo.....',
  '................',
  '................',
  '................',
];

export const NABI_PALETTE: Palette = {
  o: '#2E2A24',
  f: '#D9A05B',
  p: '#FF8FBF',
  /** 책 표지 */
  b: '#C0392B',
  /** 책장 */
  w: '#FFFBF0',
  /** 빗자루 */
  d: '#8C7A5B',
};

/** 나비의 상자 — 뽑기 연출용 2프레임 */
export const BOX_CLOSED: Grid = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...oooooooooo...',
  '...okkkkkkkko...',
  '...okkkkkkkko...',
  '...oooooooooo...',
  '...odddjjdddo...',
  '...oddddddddo...',
  '...oddddddddo...',
  '...oooooooooo...',
  '................',
  '................',
];

export const BOX_OPEN: Grid = [
  '................',
  '................',
  '...oooooooooo...',
  '...okkkkkkkko...',
  '...oooooooooo...',
  '................',
  '................',
  '................',
  '................',
  '...oooooooooo...',
  '...odddjjdddo...',
  '...oddddddddo...',
  '...oddddddddo...',
  '...oooooooooo...',
  '................',
  '................',
];

export const BOX_PALETTE: Palette = {
  o: '#2E2A24',
  k: '#A97F4E',
  d: '#6E5030',
  j: '#F5C542',
};

/**
 * 그림자·재 얼룩.
 *
 * docs/LORE.md "녹이란 무엇인가" / "재 — 무리해서 태운 불씨" — 방치되거나
 * 무리한 자리에 스미는 낡음. 원(CSS gradient)으로 그렸더니 빗방울처럼
 * 보였다 — 얼룩은 동그랗지 않다. 자연스러운 삐뚤빼뚤한 외곽선과, 안쪽에
 * 두 톤(x/y)을 섞은 얼룩덜룩한 질감으로 다시 그린다. 색은 palette로
 * 갈아끼운다(x=짙게, y=옅게) — 그림자와 재가 같은 성질(스며듦)임을
 * 형태로 보여주는 셈이다.
 */
export const BLOT_A: Grid = [
  '................',
  '................',
  '................',
  '.....xxx........',
  '....xxxxxy......',
  '...xxxxxxxxx....',
  '...xyxxxxxxy....',
  '....xxxxxxxxx...',
  '.....yxxxxxx....',
  '......xxxyx.....',
  '.......xy.......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

export const BLOT_B: Grid = [
  '................',
  '................',
  '................',
  '................',
  '......xxx.......',
  '.....xxxxxy.....',
  '.....xyxxxxx....',
  '......xxxxxxy...',
  '.......xxxxxx...',
  '........xxxyx...',
  '.........xxy....',
  '..........xy....',
  '...........x....',
  '................',
  '................',
  '................',
];

/** 그 길을 이만큼 걸어야 직업이 열린다. 대략 해당 분야 퀘스트 2~3개. */
export const UNLOCK_STAT = 100;

/**
 * 전직 경제.
 * 첫 전직은 무료 — 대신 되돌릴 수 없다.
 * 두 번째부터는 골드를 태운다. 횟수가 늘수록 비싸져서 "한 번 잘 고르라"는 압력이 된다.
 */
export const CLASS_CHANGE_BASE_COST = 5000;

export const classChangeCost = (paidChanges: number) =>
  CLASS_CHANGE_BASE_COST * (paidChanges + 1);

/** 잠긴 직업은 실루엣으로 보여준다 — 팔레트만 갈아끼우면 되니 공짜다. */
export const LOCKED_PALETTE: Palette = {
  o: '#A79B87',
  s: '#CFC5B0',
  h: '#CFC5B0',
  c: '#CFC5B0',
  d: '#A79B87',
  a: '#CFC5B0',
};

/** 견습생은 언제나 돌아갈 수 있다. 나머지는 해당 능력치를 쌓아야 열린다. */
export function isClassUnlocked(
  key: Category | 'NONE',
  stats: Stats,
): boolean {
  if (key === 'NONE') return true;
  return (stats[key] ?? 0) >= UNLOCK_STAT;
}

/** 가장 많이 쌓은 능력치가 곧 겉모습이 된다. 전부 0이면 아직 견습생. */
export function dominantClass(stats: Stats): Category | 'NONE' {
  let best: Category | 'NONE' = 'NONE';
  let bestValue = 0;
  for (const key of ['STR', 'INT', 'CHA', 'VIT', 'LUK'] as Category[]) {
    const value = stats[key] ?? 0;
    if (value > bestValue) {
      best = key;
      bestValue = value;
    }
  }
  return best;
}

/** 레벨에 따른 칭호. 새 도트를 그리지 않고도 성장을 보여주는 가장 싼 방법. */
export function titleFor(level: number): string {
  if (level >= 20) return '전설의';
  if (level >= 10) return '명예';
  if (level >= 5) return '숙련';
  return '견습';
}

/**
 * 캐릭터 레이어 조립.
 *
 * 등에 걸치는 것(망토·꼬리·배낭)은 **몸보다 먼저** 그려야 뒤로 간다.
 * 나머지 치장은 몸과 장비 위에 올린다.
 */
export function buildCharacterLayers(
  charClass: Category | 'NONE',
  cosmetics: CosmeticArt[],
): { layers: Grid[]; palette: Palette } {
  const cls = CLASSES[charClass];
  const behind: Grid[] = [];
  const front: Grid[] = [];
  const palette: Palette = { ...cls.palette };

  cosmetics.forEach((art, i) => {
    const grid = remapForSlot(COSMETIC_SHAPES[art.shape], i + 1);
    if (BEHIND_SHAPES.includes(art.shape)) behind.push(grid);
    else front.push(grid);
    Object.assign(palette, cosmeticPalette(art, i + 1));
  });

  return { layers: [...behind, BODY, cls.gear, ...front], palette };
}
