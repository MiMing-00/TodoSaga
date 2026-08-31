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

      {/* xl 미만은 그대로 한 줄로 쌓인다(상자가 위, 상점이 아래).
          xl 이상만 상자가 오른쪽 레일로 넘어간다 —
          row-reverse라 DOM 순서(Gacha 먼저)는 그대로 두고 자리만 바꾼다 */}
      <div className="flex flex-col gap-6 xl:flex-row-reverse xl:items-start xl:gap-8">
        <div className="xl:w-[320px] xl:shrink-0">
          <Gacha gold={gold} pity={gachaPity} onPull={pullGacha} />
        </div>

        <div className="min-w-0 flex-1">
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
        </div>
      </div>
    </>
  );
}
