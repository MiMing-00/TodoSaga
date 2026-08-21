import type { Grid, Palette } from './sprite';

/**
 * 나비와 지내기.
 *
 * 넓은 화면에는 내용 바깥으로 남는 공간이 꽤 크다. 그 여백에 나비가 산다.
 * 쓰다듬으면 호감도가 오르고, 단계마다 나비가 뭔가를 물어온다.
 *
 * **좁은 화면에는 두지 않는다.** 여백이 없어서 내용을 가리기만 한다.
 */

/** 하루에 쓰다듬을 수 있는 횟수. 무한이면 그냥 클릭 노가다가 된다 */
export const PET_LIMIT = 5;

export interface AffectionLevel {
  at: number;
  name: string;
  desc: string;
  gold: number;
  scales?: number;
  itemId?: string;
}

/**
 * 호감도에는 **보이는 끝이 없다.**
 *
 * 하루 상한이 5회이므로 마지막 단계 50,000은 하루도 빠짐없이 만져도
 * **1만 일**이 걸린다. 사실상 도달하지 않는 숫자다.
 *
 * 화면에는 상한을 `???`로만 보여주고 진행 막대도 두지 않는다.
 * 끝이 보이면 "만렙 찍었으니 그만"이 되는데, 이건 그런 종류의 관계가 아니다.
 */
export const AFFECTION_LEVELS: AffectionLevel[] = [
  {
    at: 10,
    name: '정식 집사',
    desc: '오늘부터 정식으로 모시겠습니다.',
    gold: 300,
    scales: 10,
  },
  {
    at: 30,
    name: '전속 집사',
    desc: '다른 용사는 받지 않기로 했습니다.',
    gold: 1000,
    scales: 20,
  },
  {
    at: 75,
    name: '가신',
    desc: '이 집의 일이라면 무엇이든 맡겨 주십시오.',
    gold: 3000,
    scales: 40,
  },
  {
    at: 150,
    name: '집사장',
    desc: '이제 이 집은 소인이 책임집니다.',
    gold: 8000,
    scales: 80,
  },
  {
    at: 500,
    name: '노집사',
    desc: '오래 모신 자만이 아는 것들이 있습니다.',
    gold: 20000,
    scales: 150,
  },
  {
    at: 1500,
    name: '둘도 없는 벗',
    desc: '이제 주종을 따지지 않기로 했습니다.',
    gold: 60000,
    scales: 400,
  },
  {
    at: 5000,
    name: '평생의 집사',
    desc: '나비가 금빛으로 빛나기 시작합니다.',
    gold: 200000,
    scales: 1000,
    itemId: 'n_fur_gold',
  },
  {
    at: 50000,
    name: '영영 함께',
    desc: '여기까지 온 용사는 아직 없습니다.',
    gold: 1000000,
    scales: 5000,
  },
];

export function affectionName(affection: number): string {
  let name = '수습 집사';
  for (const level of AFFECTION_LEVELS) {
    if (affection >= level.at) name = level.name;
  }
  return name;
}

export function claimableAffection(
  affection: number,
  claimed: number[],
): AffectionLevel[] {
  return AFFECTION_LEVELS.filter(
    (l) => affection >= l.at && !claimed.includes(l.at),
  );
}

export function nextAffection(claimed: number[]): AffectionLevel | null {
  return AFFECTION_LEVELS.find((l) => !claimed.includes(l.at)) ?? null;
}

// ─────────────────────────────────────────────
// 털색 — 팔레트만 갈아끼우면 되므로 확장이 거의 공짜다
// ─────────────────────────────────────────────

export interface FurCoat {
  id: string;
  name: string;
  palette: Palette;
}

export const DEFAULT_FUR: FurCoat = {
  id: 'fur_cheese',
  name: '치즈',
  palette: { o: '#2E2A24', f: '#D9A05B', p: '#FF8FBF', b: '#C0392B', w: '#FFFBF0', d: '#8C7A5B' },
};

export const FUR_COATS: Record<string, FurCoat> = {
  n_fur_tabby: {
    id: 'n_fur_tabby',
    name: '고등어',
    palette: { o: '#2E2A24', f: '#8C93A3', p: '#FF8FBF', b: '#C0392B', w: '#FFFBF0', d: '#8C7A5B' },
  },
  n_fur_tuxedo: {
    id: 'n_fur_tuxedo',
    name: '턱시도',
    palette: { o: '#1A1815', f: '#3A3630', p: '#FF8FBF', b: '#C0392B', w: '#FFFBF0', d: '#8C7A5B' },
  },
  n_fur_snow: {
    id: 'n_fur_snow',
    name: '눈송이',
    palette: { o: '#2E2A24', f: '#F2EADA', p: '#FF8FBF', b: '#C0392B', w: '#FFFBF0', d: '#8C7A5B' },
  },
  n_fur_calico: {
    id: 'n_fur_calico',
    name: '삼색',
    palette: { o: '#2E2A24', f: '#E8C89A', p: '#C2410C', b: '#C0392B', w: '#FFFBF0', d: '#8C7A5B' },
  },
  n_fur_shadow: {
    id: 'n_fur_shadow',
    name: '그림자',
    palette: { o: '#151318', f: '#4C3F6B', p: '#B48CFF', b: '#C0392B', w: '#FFFBF0', d: '#8C7A5B' },
  },
  // 호감도 최종 단계로만 얻는다. 뽑기에는 나오지 않는다
  n_fur_gold: {
    id: 'n_fur_gold',
    name: '금빛',
    palette: { o: '#5A3308', f: '#F5C542', p: '#FF8FBF', b: '#C0392B', w: '#FFFBF0', d: '#8C7A5B' },
  },
};

export function furPalette(furId: string | null): Palette {
  if (!furId) return DEFAULT_FUR.palette;
  return FUR_COATS[furId]?.palette ?? DEFAULT_FUR.palette;
}

// ─────────────────────────────────────────────
// 나비 치장 — 사람 치장과 몸 크기가 달라 따로 그린다
// ─────────────────────────────────────────────

const ACC: Record<string, Grid> = {
  n_acc_scarf: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...cccccccccc...',
    '..cc........cc..',
    '..cc............',
    '..cc............',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  n_acc_ribbon: [
    '................',
    '................',
    '..cc........cc..',
    '..cccc....cccc..',
    '....cc....cc....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  n_acc_bell: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...cccccccccc...',
    '.......cc.......',
    '.......cc.......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

export const NABI_ACCESSORY: Record<string, { grid: Grid; color: string }> = {
  n_acc_scarf: { grid: ACC.n_acc_scarf, color: '#E05C5C' },
  n_acc_ribbon: { grid: ACC.n_acc_ribbon, color: '#FF6FA5' },
  n_acc_bell: { grid: ACC.n_acc_bell, color: '#F5C542' },
};

/** 나비를 그릴 레이어와 팔레트 */
export function buildNabi(
  base: Grid,
  furId: string | null,
  accessoryId: string | null,
): { layers: Grid[]; palette: Palette } {
  const palette: Palette = { ...furPalette(furId) };
  const layers: Grid[] = [base];

  const acc = accessoryId ? NABI_ACCESSORY[accessoryId] : null;
  if (acc) {
    layers.push(acc.grid);
    palette.c = acc.color;
  }

  return { layers, palette };
}
