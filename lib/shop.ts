import type { OwnedItem } from './inventory';
import { enhanceCost, poolFor, type Item, type ItemAxis } from './items';
import type { Rank } from './quest';
import type { Category } from './quest';

/**
 * 상점.
 *
 * 진열도 **직업 필터를 통과한다** — 못 쓰는 걸 팔면 안 된다.
 * 장비는 `price`가 없어서 진열되지 않는다. 장비는 퀘스트 드랍으로만 얻는다 —
 * 돈으로 강해지는 길을 열면 퀘스트를 완료할 이유가 줄어든다.
 */

/** 퀘스트 하나를 다시 뽑는 값. 가장 싼 sink이자 실제 불편을 해결한다 */
export const REROLL_COST = 50;

// ─────────────────────────────────────────────
// 오늘의 매물
//
// 진열대가 매일 똑같으면 들를 이유가 없다. 골드는 계속 쌓이는데
// "언젠가 사면 되지"가 되면 영영 안 산다.
//
// 그래서 **하루에 하나만** 값을 깎는다. 날짜로 정하므로 새로고침해도
// 바뀌지 않는다 — 다시 굴릴 수 있으면 그건 할인이 아니라 뽑기다.
// ─────────────────────────────────────────────

export const DEAL_OFF = 0.3;

/** 날짜 문자열을 작은 정수로. 같은 날이면 늘 같은 값이 나온다 */
function seedOf(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i += 1) h = (h * 31 + date.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 오늘 값을 깎아 주는 물건. 살 수 있는 게 없으면 null */
export function dealItemId(
  charClass: Category | 'NONE',
  date: string,
): string | null {
  const pool = poolFor(charClass)
    .filter((i) => i.price != null && !i.gachaOnly && !i.streakOnly)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (pool.length === 0) return null;
  return pool[seedOf(date) % pool.length].id;
}

/** 진열가. 화면과 실제 결제가 어긋나면 안 되므로 양쪽 다 이 함수를 쓴다 */
export function priceOf(
  item: Item,
  charClass: Category | 'NONE',
  date: string,
): number {
  const base = item.price ?? 0;
  return item.id === dealItemId(charClass, date)
    ? Math.max(1, Math.round((base * (1 - DEAL_OFF)) / 10) * 10)
    : base;
}

export interface ShopEntry {
  item: Item;
  price: number;
  /** 값을 깎기 전 가격. 오늘의 매물일 때만 채워진다 */
  wasPrice: number | null;
  /** 이미 가지고 있어 살 필요가 없다 (소모품은 제외) */
  owned: boolean;
}

export function shopEntries(
  charClass: Category | 'NONE',
  inventory: OwnedItem[],
  axis?: ItemAxis,
  date = '',
): ShopEntry[] {
  const ownedIds = new Set(inventory.map((o) => o.itemId));
  const deal = date ? dealItemId(charClass, date) : null;

  return poolFor(charClass)
    .filter((item) => item.price != null && !item.gachaOnly && !item.streakOnly)
    .filter((item) => (axis ? item.axis === axis : true))
    .map((item) => ({
      item,
      price: date ? priceOf(item, charClass, date) : item.price!,
      wasPrice: item.id === deal ? item.price! : null,
      owned: !item.consumable && ownedIds.has(item.id),
    }))
    // 오늘의 매물은 맨 위로. 아래에 묻히면 할인인 줄도 모른다
    .sort((a, b) =>
      (b.wasPrice ? 1 : 0) - (a.wasPrice ? 1 : 0) || a.price - b.price,
    );
}

/** 상점에 실제로 물건이 있는 축만 탭으로 보여준다 */
export function shopAxes(
  charClass: Category | 'NONE',
  inventory: OwnedItem[],
): ItemAxis[] {
  const all = shopEntries(charClass, inventory);
  return (['tool', 'cosmetic'] as ItemAxis[]).filter((axis) =>
    all.some((e) => e.item.axis === axis),
  );
}

// ─────────────────────────────────────────────
// 판매
//
// 더 좋은 장비가 나오면 쓰던 건 짐이 된다. 전직으로 잠긴 것도 마찬가지다.
// 팔 수 없으면 가방이 못 쓰는 물건으로 계속 불어난다.
// ─────────────────────────────────────────────

/** 장비는 `price`가 없으므로(상점 미판매) 등급으로 값을 매긴다 */
const RANK_VALUE: Record<Rank, number> = {
  F: 50, D: 120, C: 300, B: 700, A: 1500, S: 3000,
};

/** 되판다고 산 값을 다 돌려주지는 않는다 */
const SELL_RATE = 0.4;
/** 강화에 부은 골드는 조금 더 돌려준다 — 안 그러면 강화한 장비를 못 버린다 */
const ENHANCE_REFUND_RATE = 0.2;

export function sellValue(item: Item, enhance = 0): number {
  const base = item.price ?? RANK_VALUE[item.rank];

  let invested = 0;
  for (let n = 1; n <= enhance; n += 1) invested += enhanceCost(item.rank, n);

  return (
    Math.floor(base * SELL_RATE) +
    Math.floor(invested * ENHANCE_REFUND_RATE)
  );
}
