'use client';

import { Gacha } from '@/app/components/Gacha';
import { Shop } from '@/app/components/Shop';
import { getItem } from '@/lib/items';
import { useSagaStore } from '@/lib/store';

export default function ShopPage() {
  const gold = useSagaStore((s) => s.gold);
  const charClass = useSagaStore((s) => s.charClass);
  const inventory = useSagaStore((s) => s.inventory);
  const buyItem = useSagaStore((s) => s.buyItem);
  const showToast = useSagaStore((s) => s.showToast);
  const gachaPity = useSagaStore((s) => s.gachaPity);
  const pullGacha = useSagaStore((s) => s.pullGacha);

  return (
    <>
      <h1 className="font-display text-lg text-ink sm:text-xl">▸ 상점</h1>

      <Gacha gold={gold} pity={gachaPity} onPull={pullGacha} />

      <Shop
        gold={gold}
        charClass={charClass}
        inventory={inventory}
        onBuy={(itemId) => {
          const err = buyItem(itemId);
          if (!err) {
            const item = getItem(itemId);
            if (item) showToast(`사들였습니다 — ${item.name}`);
          }
          return err;
        }}
      />
    </>
  );
}
