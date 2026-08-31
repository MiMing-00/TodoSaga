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

      {/* 상점(사서 얻는다)이 이 페이지의 본론, 상자(뽑아서 얻는다)는
          곁다리다. 좁은 화면에서 위아래로 쌓일 때도 본론이 먼저 보이도록
          DOM 순서 자체를 상점 먼저로 둔다 — xl에서도 그대로 왼쪽이 상점 */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8">
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

        <div className="xl:w-[320px] xl:shrink-0">
          <Gacha gold={gold} pity={gachaPity} onPull={pullGacha} />
        </div>
      </div>
    </>
  );
}
