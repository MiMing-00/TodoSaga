import type { CosmeticArt } from './cosmetics';
import type { Category } from './quest';
import {
  COSMETIC_SLOTS,
  EQUIPMENT_SLOTS,
  TOOL_SLOTS,
  canEquip,
  effectPercent,
  getItem,
  type EquipContext,
  type Item,
  type Slot,
} from './items';

/** 보유 중인 개체 하나. 같은 아이템도 강화 단계가 다르면 별개다. */
export interface OwnedItem {
  /** 개체 고유 id (아이템 정의 id와 다름) */
  uid: string;
  itemId: string;
  /** 강화 단계 0~10. 장비만 의미 있다 */
  enhance: number;
  /** 유지(실패)가 누적된 횟수 — 다음 성공률 +5%p씩 */
  fails: number;
  /** 소모품 개수. 소모품이 아니면 1 */
  count: number;
}

/** 슬롯 → 장착된 개체 uid */
export type Equipped = Partial<Record<Slot, string>> & {
  /** 도구는 2칸이라 배열로 따로 관리한다 */
  tools?: string[];
};

export const ALL_EQUIP_SLOTS: Slot[] = [...COSMETIC_SLOTS, ...EQUIPMENT_SLOTS];

let seq = 0;
export function newUid(itemId: string): string {
  seq += 1;
  return `${itemId}#${Date.now().toString(36)}${seq.toString(36)}`;
}

export function findOwned(
  inventory: OwnedItem[],
  uid: string,
): OwnedItem | undefined {
  return inventory.find((o) => o.uid === uid);
}

export function itemOf(owned: OwnedItem): Item | undefined {
  return getItem(owned.itemId);
}

/**
 * 소모품은 개수만 올리고, 나머지는 개체를 새로 만든다.
 * 같은 치장을 또 얻으면 중복 — 뽑기에서는 나비의 털로 전환된다.
 */
export function addItem(
  inventory: OwnedItem[],
  itemId: string,
): { inventory: OwnedItem[]; duplicate: boolean } {
  const def = getItem(itemId);
  if (!def) return { inventory, duplicate: false };

  if (def.consumable) {
    const existing = inventory.find((o) => o.itemId === itemId);
    if (existing) {
      return {
        inventory: inventory.map((o) =>
          o.uid === existing.uid ? { ...o, count: o.count + 1 } : o,
        ),
        duplicate: false,
      };
    }
  }

  // 치장·도구는 하나만 있으면 충분하다. 이미 있으면 중복으로 알린다
  if (def.axis !== 'equipment') {
    const owned = inventory.some((o) => o.itemId === itemId);
    if (owned) return { inventory, duplicate: true };
  }

  return {
    inventory: [
      ...inventory,
      { uid: newUid(itemId), itemId, enhance: 0, fails: 0, count: 1 },
    ],
    duplicate: false,
  };
}

export function removeItem(
  inventory: OwnedItem[],
  uid: string,
): OwnedItem[] {
  return inventory.filter((o) => o.uid !== uid);
}

/** 장착된 개체 uid 목록 (도구 포함) */
export function equippedUids(equipped: Equipped): string[] {
  const uids = ALL_EQUIP_SLOTS.map((s) => equipped[s]).filter(
    (v): v is string => Boolean(v),
  );
  return [...uids, ...(equipped.tools ?? [])];
}

export type EquipResult =
  | { ok: true; equipped: Equipped }
  | { ok: false; reason: string };

export function equip(
  equipped: Equipped,
  inventory: OwnedItem[],
  uid: string,
  ctx: EquipContext,
): EquipResult {
  const owned = findOwned(inventory, uid);
  if (!owned) return { ok: false, reason: '보유하지 않은 아이템' };

  const def = itemOf(owned);
  if (!def) return { ok: false, reason: '알 수 없는 아이템' };
  if (def.consumable) return { ok: false, reason: '소모품은 장착할 수 없어요' };

  const check = canEquip(def, ctx);
  if (!check.ok) return { ok: false, reason: check.reason };

  if (def.slot === 'tool') {
    const tools = equipped.tools ?? [];
    if (tools.includes(uid)) return { ok: true, equipped };
    if (tools.length >= TOOL_SLOTS) {
      return { ok: false, reason: `도구는 ${TOOL_SLOTS}개까지예요` };
    }
    return { ok: true, equipped: { ...equipped, tools: [...tools, uid] } };
  }

  return { ok: true, equipped: { ...equipped, [def.slot]: uid } };
}

export function unequip(equipped: Equipped, uid: string): Equipped {
  const next: Equipped = { ...equipped };
  for (const slot of ALL_EQUIP_SLOTS) {
    if (next[slot] === uid) delete next[slot];
  }
  if (next.tools?.includes(uid)) {
    next.tools = next.tools.filter((t) => t !== uid);
  }
  return next;
}

/**
 * 전직 등으로 더 이상 장착할 수 없게 된 것을 벗긴다.
 * 인벤토리에서 지우지는 않는다 — 그 직업으로 돌아오면 되살아난다.
 */
export function pruneEquipped(
  equipped: Equipped,
  inventory: OwnedItem[],
  ctx: EquipContext,
): Equipped {
  let next = equipped;
  for (const uid of equippedUids(equipped)) {
    const owned = findOwned(inventory, uid);
    const def = owned && itemOf(owned);
    if (!def || !canEquip(def, ctx).ok) {
      next = unequip(next, uid);
    }
  }
  return next;
}

/** 전직 확인 패널에서 "몇 개가 잠기는지" 미리 보여주기 위한 계산 */
export function countLockedBy(
  inventory: OwnedItem[],
  nextClass: EquipContext['charClass'],
): number {
  return inventory.filter((o) => {
    const def = itemOf(o);
    return def?.classLock != null && def.classLock !== nextClass;
  }).length;
}

// ─────────────────────────────────────────────
// 장착 효과
//
// 인벤토리에 "골드 +5%"라고 써놓고 실제로 안 주면 그건 거짓말이다.
// 여기서 계산한 배율이 EXP·골드·능력치 획득에 실제로 곱해진다.
// ─────────────────────────────────────────────

export interface Bonus {
  /** 1.0 = 보너스 없음 */
  expMult: number;
  goldMult: number;
  /** 어제 놓친 퀘스트 때문에 깎이는 비율(%). 0이면 없음 */
  debuffPercent: number;
}

export const NO_BONUS: Bonus = { expMult: 1, goldMult: 1, debuffPercent: 0 };

/**
 * 장착 중인 장비의 효과를 합산한다.
 * categoryExp는 해당 카테고리 퀘스트일 때만 적용된다.
 */
export function computeBonus(
  inventory: OwnedItem[],
  equipped: Equipped,
  category: Category,
): Bonus {
  let exp = 0;
  let gold = 0;

  for (const uid of equippedUids(equipped)) {
    const owned = findOwned(inventory, uid);
    if (!owned) continue;
    const def = itemOf(owned);
    if (!def?.effect) continue;

    const percent = effectPercent(def, owned.enhance);
    if (def.effect.kind === 'exp') exp += percent;
    else if (def.effect.kind === 'gold') gold += percent;
    else if (def.effect.category === category) exp += percent;
  }

  return { expMult: 1 + exp / 100, goldMult: 1 + gold / 100, debuffPercent: 0 };
}

/**
 * 디버프를 얹는다. 장비 보너스와 곱셈으로 합쳐지므로
 * 장비를 잘 갖췄다면 디버프를 상쇄할 수 있다.
 */
export function withDebuff(bonus: Bonus, percent: number): Bonus {
  if (percent <= 0) return bonus;
  return {
    ...bonus,
    expMult: bonus.expMult * (1 - percent / 100),
    debuffPercent: percent,
  };
}

/** 장착 중인 치장의 그림 정보. 캐릭터 스프라이트에 겹쳐 그린다 */
export function equippedCosmetics(
  inventory: OwnedItem[],
  equipped: Equipped,
): CosmeticArt[] {
  return COSMETIC_SLOTS.map((slot) => {
    const uid = equipped[slot];
    if (!uid) return null;
    const owned = findOwned(inventory, uid);
    return (owned && itemOf(owned)?.art) ?? null;
  }).filter((art): art is CosmeticArt => art !== null);
}
