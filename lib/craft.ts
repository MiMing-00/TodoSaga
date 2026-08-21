import type { Category, Rank } from './quest';
import { poolFor, type Item, type ItemAxis } from './items';

/**
 * 꽝과 조합.
 *
 * 뽑기에 꽝은 있어야 한다 — 꽝이 없으면 긴장이 없고, 좋은 게 나와도 안 기쁘다.
 * 대신 꽝이 **막다른 길**이면 안 된다. 꽝은 재료로 쌓이고, 모으면 아이템이 된다.
 * "꽝 + 꽝 + 꽝 = A등급 확정"이 이 시스템의 핵심 약속이다.
 */

export type MaterialId = 'm_scrap' | 'm_cloth' | 'm_gem' | 'm_scale';

export interface Material {
  id: MaterialId;
  name: string;
  /** 이 재료가 향하는 계열 */
  axis: ItemAxis | 'any';
  desc: string;
}

export const MATERIALS: Record<MaterialId, Material> = {
  m_scrap: { id: 'm_scrap', name: '녹슨 조각', axis: 'equipment', desc: '아직 쇠는 쇠다.' },
  m_cloth: { id: 'm_cloth', name: '빛바랜 천', axis: 'cosmetic', desc: '색은 날았지만 튼튼하다.' },
  m_gem: { id: 'm_gem', name: '흐릿한 원석', axis: 'tool', desc: '닦으면 뭔가 보일지도.' },
  m_scale: { id: 'm_scale', name: '나비의 털', axis: 'any', desc: '쓰다듬을 때마다 조금씩 쌓인다.' },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];

export type Materials = Record<MaterialId, number>;

export const EMPTY_MATERIALS: Materials = {
  m_scrap: 0, m_cloth: 0, m_gem: 0, m_scale: 0,
};

/** 뽑기 꽝에서 나오는 재료 (나비의 털은 중복 전용이라 제외) */
const DUD_MATERIALS: MaterialId[] = ['m_scrap', 'm_cloth', 'm_gem'];

export function rollDudMaterial(rng: () => number = Math.random): MaterialId {
  return DUD_MATERIALS[Math.floor(rng() * DUD_MATERIALS.length)];
}

// ─────────────────────────────────────────────
// 레시피
// ─────────────────────────────────────────────

export interface Recipe {
  id: string;
  name: string;
  cost: Partial<Materials>;
  /** 결과로 나올 수 있는 등급 */
  ranks: Rank[];
  /** 결과 계열. null이면 전 계열 */
  axis: ItemAxis | null;
  desc: string;
}

export const RECIPES: Recipe[] = [
  {
    id: 'r_equipment',
    name: '조각 벼리기',
    cost: { m_scrap: 5 },
    ranks: ['D', 'C'],
    axis: 'equipment',
    desc: '녹슨 조각을 모아 쓸 만한 장비로.',
  },
  {
    id: 'r_cosmetic',
    name: '천 짜기',
    cost: { m_cloth: 5 },
    ranks: ['D', 'C'],
    axis: 'cosmetic',
    desc: '빛바랜 천을 모아 새 치장으로.',
  },
  {
    id: 'r_tool',
    name: '원석 다듬기',
    cost: { m_gem: 5 },
    ranks: ['C', 'B'],
    axis: 'tool',
    desc: '흐릿한 원석을 갈아 도구로.',
  },
  {
    id: 'r_grand',
    name: '삼재 합성',
    cost: { m_scrap: 3, m_cloth: 3, m_gem: 3 },
    ranks: ['A'],
    axis: null,
    desc: '세 재료를 한데 녹인다. A등급이 확정으로 나온다.',
  },
  {
    id: 'r_scale_exchange',
    name: '털 교환',
    cost: { m_scale: 100 },
    ranks: ['C', 'B', 'A'],
    axis: 'cosmetic',
    desc: '보유 중인 게 겹칠수록 쌓인다. 원하는 걸 확정으로 바꾼다.',
  },
];

export function canCraft(recipe: Recipe, have: Materials): boolean {
  return MATERIAL_IDS.every(
    (id) => (have[id] ?? 0) >= (recipe.cost[id] ?? 0),
  );
}

export function payCost(recipe: Recipe, have: Materials): Materials {
  const next = { ...have };
  for (const id of MATERIAL_IDS) {
    next[id] = (next[id] ?? 0) - (recipe.cost[id] ?? 0);
  }
  return next;
}

/**
 * 조합 결과. 여기도 직업 필터를 통과한다 —
 * 애써 모은 재료로 못 쓰는 템이 나오면 꽝보다 나쁘다.
 */
export function craft(
  recipe: Recipe,
  charClass: Category | 'NONE',
  rng: () => number = Math.random,
): Item | null {
  let pool = poolFor(charClass).filter((i) => !i.gachaOnly && !i.streakOnly);
  if (recipe.axis) pool = pool.filter((i) => i.axis === recipe.axis);
  pool = pool.filter((i) => recipe.ranks.includes(i.rank));

  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

/** 부족한 재료를 알려준다 (UI 표시용) */
export function missingFor(
  recipe: Recipe,
  have: Materials,
): { id: MaterialId; need: number }[] {
  return MATERIAL_IDS.map((id) => ({
    id,
    need: (recipe.cost[id] ?? 0) - (have[id] ?? 0),
  })).filter((m) => m.need > 0);
}
