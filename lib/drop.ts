import type { Category, Rank } from './quest';
import { rollDudMaterial, type MaterialId } from './craft';
import { poolFor, type Item, type ItemAxis } from './items';

/**
 * 퀘스트 드랍.
 *
 * 두 가지를 반드시 지킨다 (docs/ITEMS.md 2-2, 6):
 *  1. 드랍 풀은 항상 `poolFor(charClass)`를 통과한다 — 못 쓰는 템은 나올 수 없다
 *  2. AI가 짓는 rewards.loot 이름은 여기 관여하지 않는다 — 그건 수집용 기념품이고,
 *     실제 효과 아이템은 코드가 정한 테이블에서만 나온다
 */

/** 퀘스트 랭크가 높을수록 좋은 게 나온다 — 어려운 일을 미루지 않을 이유 */
const DROP_CHANCE: Record<Rank, number> = {
  F: 0.15, D: 0.25, C: 0.35, B: 0.5, A: 0.7, S: 1.0,
};

/** 퀘스트 랭크 → 나올 수 있는 아이템 등급의 가중치 */
const RANK_WEIGHTS: Record<Rank, Partial<Record<Rank, number>>> = {
  F: { F: 80, D: 20 },
  D: { F: 55, D: 35, C: 10 },
  C: { F: 30, D: 40, C: 25, B: 5 },
  B: { D: 30, C: 40, B: 25, A: 5 },
  A: { C: 30, B: 40, A: 25, S: 5 },
  S: { B: 30, A: 50, S: 20 },
};

/** 드랍은 장비 위주. 치장은 상점·뽑기가 주 경로다 */
/** 나비 물건은 드랍으로 나오지 않는다 — 뽑기에서만 만난다 */
const AXIS_WEIGHTS: Record<ItemAxis, number> = {
  equipment: 70,
  cosmetic: 25,
  tool: 5,
  nabi: 0,
};

function pickWeighted<T>(entries: [T, number][], rng: () => number): T | null {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return null;
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export interface DropContext {
  charClass: Category | 'NONE';
  questRank: Rank;
}

/**
 * 퀘스트 하나를 완료했을 때의 드랍. 안 나올 수도 있다(null).
 * rng를 주입받아 테스트에서 결정론적으로 검증할 수 있게 한다.
 */
export function rollDrop(
  { charClass, questRank }: DropContext,
  rng: () => number = Math.random,
): Item | null {
  if (rng() > DROP_CHANCE[questRank]) return null;

  // 뽑기 전용은 드랍에서 제외한다 — 뽑기의 이유가 사라지면 안 된다
  const pool = poolFor(charClass).filter((i) => !i.gachaOnly && !i.streakOnly);
  if (pool.length === 0) return null;

  const axis = pickWeighted(
    (Object.entries(AXIS_WEIGHTS) as [ItemAxis, number][]).filter(([a]) =>
      pool.some((i) => i.axis === a),
    ),
    rng,
  );
  if (!axis) return null;

  const byAxis = pool.filter((i) => i.axis === axis);
  const weights = RANK_WEIGHTS[questRank];

  const rank = pickWeighted(
    (Object.entries(weights) as [Rank, number][]).filter(([r]) =>
      byAxis.some((i) => i.rank === r),
    ),
    rng,
  );
  if (!rank) return null;

  const candidates = byAxis.filter((i) => i.rank === rank);
  return candidates[Math.floor(rng() * candidates.length)] ?? null;
}

// ─────────────────────────────────────────────
// 뽑기 「나비의 상자」
// ─────────────────────────────────────────────

export const GACHA_PRICE = 300;
export const GACHA_PRICE_10 = 2700;
/** 이 횟수 안에 A 이상이 반드시 나온다 */
export const GACHA_PITY = 50;

const GACHA_WEIGHTS: Record<Rank, number> = {
  F: 50, D: 25, C: 15, B: 7, A: 2.5, S: 0.5,
};

/**
 * 뽑기 결과는 둘 중 하나다.
 *
 * 꽝은 **있어야 한다** — 꽝이 없으면 긴장이 없고, 좋은 게 나와도 안 기쁘다.
 * 대신 꽝이 막다른 길이면 안 되므로 재료로 남긴다.
 * 꽝 세 종류를 3개씩 모으면 「삼재 합성」으로 A등급이 확정으로 나온다.
 */
export type GachaPull =
  | { kind: 'dud'; material: MaterialId; shakes: 2 }
  | {
      kind: 'item';
      item: Item;
      /** 이미 보유 중이라 나비의 털로 전환된 경우 */
      duplicate: boolean;
      shakes: 3 | 5 | 7;
    };

export function shakesFor(rank: Rank): 3 | 5 | 7 {
  if (rank === 'A' || rank === 'S') return 7;
  if (rank === 'C' || rank === 'B') return 5;
  return 3;
}

/** 꽝 확률. 40%는 아프지만, 전부 재료로 쌓이므로 손해는 아니다 */
export const DUD_CHANCE = 0.4;

/** 중복 치장 → 나비의 털. 등급이 높을수록 많이 준다 */
const SCALES_BY_RANK: Record<Rank, number> = {
  F: 3, D: 5, C: 12, B: 25, A: 50, S: 100,
};

export const scalesFor = (rank: Rank) => SCALES_BY_RANK[rank];

/**
 * 뽑기 1회. 치장만 나온다 — 능력이 확률에 갇히면 "안 뽑히면 손해"가 된다.
 * pityCount는 A 이상이 안 나온 연속 횟수.
 */
export function rollGacha(
  charClass: Category | 'NONE',
  ownedItemIds: Set<string>,
  pityCount: number,
  rng: () => number = Math.random,
): GachaPull | null {
  // 치장 + 나비 물건. 나비 것은 전부 B~S 등급이라 자연히 드물게 나온다
  const pool = poolFor(charClass).filter(
    (i) => (i.axis === 'cosmetic' || i.axis === 'nabi') && !i.streakOnly,
  );
  if (pool.length === 0) return null;

  // 천장이 차오르면 꽝도 건너뛴다
  const forced = pityCount + 1 >= GACHA_PITY;

  if (!forced && rng() < DUD_CHANCE) {
    return { kind: 'dud', material: rollDudMaterial(rng), shakes: 2 };
  }

  const allowed: Rank[] = forced ? ['A', 'S'] : ['F', 'D', 'C', 'B', 'A', 'S'];

  const rank = pickWeighted(
    allowed
      .filter((r) => pool.some((i) => i.rank === r))
      .map((r) => [r, GACHA_WEIGHTS[r]] as [Rank, number]),
    rng,
  );
  if (!rank) return null;

  const candidates = pool.filter((i) => i.rank === rank);
  const item = candidates[Math.floor(rng() * candidates.length)];
  if (!item) return null;

  return {
    kind: 'item',
    item,
    duplicate: ownedItemIds.has(item.id),
    shakes: shakesFor(rank),
  };
}

/** 뽑기 한 번의 결과. UI 연출과 실제 지급을 같은 데이터로 처리한다 */
export type GachaOutcome =
  | { kind: 'dud'; material: MaterialId; shakes: 2 }
  | { kind: 'item'; itemId: string; name: string; rank: Rank; shakes: 3 | 5 | 7 }
  | {
      kind: 'duplicate';
      itemId: string;
      name: string;
      rank: Rank;
      scales: number;
      shakes: 3 | 5 | 7;
    };

/** 등급별 빛기둥 색. 픽셀 아트라 그라디언트가 아니라 단색 계단으로 쓴다 */
export const BEAM_COLOR: Record<Rank, string> = {
  F: 'bg-ink-disabled',
  D: 'bg-ink-disabled',
  C: 'bg-exp',
  B: 'bg-int',
  A: 'bg-primary',
  S: 'bg-gold',
};

const RANK_ORDER: Rank[] = ['F', 'D', 'C', 'B', 'A', 'S'];

/** 10연차에서 풀 연출을 재생할 **가장 높은 등급**의 결과 */
export function bestOutcome(outcomes: GachaOutcome[]): GachaOutcome | null {
  let best: GachaOutcome | null = null;
  let bestIndex = -1;
  for (const o of outcomes) {
    const index = o.kind === 'dud' ? -1 : RANK_ORDER.indexOf(o.rank);
    if (index > bestIndex) {
      best = o;
      bestIndex = index;
    }
  }
  return best ?? outcomes[0] ?? null;
}
