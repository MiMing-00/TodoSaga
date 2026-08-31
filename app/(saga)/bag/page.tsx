'use client';

import { Inventory } from '@/app/components/Inventory';
import { Vault } from '@/app/components/Vault';
import { MATERIAL_IDS } from '@/lib/craft';
import { levelFromExp } from '@/lib/quest';
import { activeStreak, collectLoot, useSagaStore } from '@/lib/store';
import Link from 'next/link';

export default function BagPage() {
  const exp = useSagaStore((s) => s.exp);
  const gold = useSagaStore((s) => s.gold);
  const stats = useSagaStore((s) => s.stats);
  const days = useSagaStore((s) => s.days);
  const charClass = useSagaStore((s) => s.charClass);
  const streak = useSagaStore((s) => s.streak);
  const lastClearedDate = useSagaStore((s) => s.lastClearedDate);
  const inventory = useSagaStore((s) => s.inventory);
  const equipped = useSagaStore((s) => s.equipped);
  const materials = useSagaStore((s) => s.materials);
  const equipAction = useSagaStore((s) => s.equip);
  const unequipAction = useSagaStore((s) => s.unequip);
  const sellItem = useSagaStore((s) => s.sellItem);
  const showToast = useSagaStore((s) => s.showToast);

  const held = MATERIAL_IDS.reduce((n, id) => n + (materials[id] ?? 0), 0);

  return (
    <>
      <h1 className="font-display text-lg text-ink sm:text-xl">▸ 소지품</h1>

      {/* 여비·전리품은 숫자와 태그 몇 개뿐이라 옆에 세울 만큼 무게가
          없다. 가로 배너로 접어 위에 얹고, 봇짐이 화면 전체를 쓴다 */}
      <Vault gold={gold} loot={collectLoot(days)} />

      <Inventory
        inventory={inventory}
        equipped={equipped}
        ctx={{
          charClass,
          level: levelFromExp(exp),
          stats,
          streak: activeStreak(streak, lastClearedDate),
        }}
        onEquip={equipAction}
        onUnequip={unequipAction}
        onSell={(uid) => {
          const result = sellItem(uid);
          if ('error' in result) return result.error;
          showToast(`팔았습니다 — ${result.gold.toLocaleString()} G`);
          return null;
        }}
      />

      {/* 만드는 일은 아래 화면으로 내렸다. 입구는 하나만 둔다.
          카드 하나짜리 버튼이라 화면 폭 전체로 늘리지 않는다 — 늘리면
          오른쪽이 통째로 비어 '빈 배너'처럼 읽힌다 */}
      <Link
        href="/bag/forge"
        className="press flex max-w-2xl items-center gap-3 border-[3px] border-ink bg-surface px-4 py-3.5 shadow-pixel transition-[transform,box-shadow] duration-100 hover:-translate-y-px"
      >
        <span aria-hidden className="text-xl leading-none">
          ⚒
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[13px] text-ink">
            벼리는 곳
          </span>
          <span className="mt-1 block text-[11px] break-keep text-ink-muted">
            재료로 물건을 만들고, 장비를 두드려 더 좋게 만듭니다
            {held > 0 && (
              <span className="text-ink"> · 재료 {held}개 보유</span>
            )}
          </span>
        </span>
        <span aria-hidden className="font-display text-sm text-ink-muted">
          ▸
        </span>
      </Link>
    </>
  );
}
