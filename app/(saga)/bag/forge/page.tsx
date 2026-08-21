'use client';

import { EnhanceDialog } from '@/app/components/EnhanceDialog';
import { Forge } from '@/app/components/Forge';
import { getItem } from '@/lib/items';
import { useSagaStore } from '@/lib/store';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgePage() {
  const gold = useSagaStore((s) => s.gold);
  const shards = useSagaStore((s) => s.shards);
  const inventory = useSagaStore((s) => s.inventory);
  const equipped = useSagaStore((s) => s.equipped);
  const materials = useSagaStore((s) => s.materials);
  const craftRecipe = useSagaStore((s) => s.craftRecipe);
  const enhanceItem = useSagaStore((s) => s.enhanceItem);
  const showToast = useSagaStore((s) => s.showToast);
  const clearDrop = useSagaStore((s) => s.clearDrop);

  const [forging, setForging] = useState<string | null>(null);
  const target = inventory.find((o) => o.uid === forging) ?? null;

  return (
    <>
      <div>
        <Link
          href="/bag"
          className="press inline-block font-display text-[11px] text-ink-muted hover:text-ink"
        >
          ◂ 소지품
        </Link>
        <h1 className="mt-2 font-display text-lg text-ink sm:text-xl">
          ▸ 벼리는 곳
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed break-keep text-ink-muted">
          모은 재료로 물건을 만들고, 쓰던 장비를 두드려 더 좋게 만듭니다.
        </p>
      </div>

      <Forge
        materials={materials}
        inventory={inventory}
        equipped={equipped}
        onCraft={(id) => {
          const got = craftRecipe(id);
          if (got) {
            const item = getItem(got);
            if (item) showToast(`벼려냈습니다 — ${item.name}`);
            clearDrop();
          }
          return got;
        }}
        onEnhance={setForging}
      />

      {target && (
        <EnhanceDialog
          owned={target}
          gold={gold}
          shards={shards}
          onEnhance={(protect) => enhanceItem(target.uid, protect)}
          onClose={() => setForging(null)}
        />
      )}
    </>
  );
}
