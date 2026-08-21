'use client';

import {
  MATERIALS,
  MATERIAL_IDS,
  RECIPES,
  canCraft,
  missingFor,
  type Materials,
} from '@/lib/craft';
import { itemOf, type Equipped, type OwnedItem, equippedUids } from '@/lib/inventory';
import { MAX_ENHANCE, effectPercent } from '@/lib/items';
import { RANK } from '@/lib/quest';
import { Panel, PixelButton } from './Pixel';

/**
 * 벼리는 곳.
 *
 * 재료·조합·강화는 셋 다 **무언가를 만드는 일**인데, 봇짐 안의 한 탭에
 * 섞여 있었다. 봇짐은 "가진 걸 보는 곳"이고 여기는 "만드는 곳"이라
 * 목적이 다르다. 한 화면에 있으면 둘 다 흐려진다.
 *
 * 탭을 늘리지는 않는다 — 소지품의 **아래 화면**이다.
 * 자주 오는 곳이 아니라서 길찾기에 자리를 내줄 만큼은 아니다.
 */
export function Forge({
  materials,
  inventory,
  equipped,
  onCraft,
  onEnhance,
}: {
  materials: Materials;
  inventory: OwnedItem[];
  equipped: Equipped;
  onCraft: (recipeId: string) => string | null;
  onEnhance: (uid: string) => void;
}) {
  const worn = new Set(equippedUids(equipped));
  const forgeable = inventory
    .filter((o) => itemOf(o)?.axis === 'equipment' && o.enhance < MAX_ENHANCE)
    .sort((a, b) => b.enhance - a.enhance);

  return (
    <>
      <Panel title="재료">
        <ul className="grid grid-cols-2 gap-1.5">
          {MATERIAL_IDS.map((id) => (
            <li
              key={id}
              className="flex items-baseline justify-between gap-2 border-2 border-ink bg-sunken px-2.5 py-1.5"
            >
              <span className="font-display text-[11px] text-ink">
                {MATERIALS[id].name}
              </span>
              <span className="font-display text-[11px] tabular-nums text-ink-muted">
                {materials[id] ?? 0}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed break-keep text-ink-muted">
          상자에서 꽝이 나와도 재료로 남습니다. 모으면 여기서 물건이 됩니다.
        </p>
      </Panel>

      <Panel title="조합">
        <ul className="flex flex-col gap-2">
          {RECIPES.map((recipe) => {
            const ready = canCraft(recipe, materials);
            const missing = missingFor(recipe, materials);
            return (
              <li
                key={recipe.id}
                className={`flex items-start gap-3 border-2 p-2.5 ${
                  ready ? 'border-ink bg-surface' : 'border-ink-disabled bg-sunken'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-display text-[12px] ${
                      ready ? 'text-ink' : 'text-ink-disabled'
                    }`}
                  >
                    {recipe.name}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed break-keep text-ink-muted">
                    {recipe.desc}
                  </p>
                  {!ready && (
                    <p className="mt-1 font-display text-[10px] text-ink-disabled">
                      {missing
                        .map((m) => `${MATERIALS[m.id].name} ${m.need} 부족`)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                <PixelButton
                  onClick={() => onCraft(recipe.id)}
                  disabled={!ready}
                  className="shrink-0 px-2.5 py-1 text-[11px] shadow-pixel-sm"
                >
                  조합
                </PixelButton>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="벼리기">
        {forgeable.length === 0 ? (
          <p className="border-2 border-dashed border-ink-disabled px-4 py-8 text-center text-xs break-keep text-ink-muted">
            벼릴 장비가 없습니다. 의뢰를 완수하면 하나씩 나옵니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {forgeable.map((owned) => {
              const def = itemOf(owned)!;
              const rank = RANK[def.rank] ?? RANK.F;
              return (
                <li
                  key={owned.uid}
                  className="flex items-center gap-3 border-2 border-ink bg-surface p-2.5"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm ${rank.badge}`}
                  >
                    {def.rank}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[13px] break-keep text-ink">
                      {def.name}
                      {owned.enhance > 0 && (
                        <span className="text-primary"> +{owned.enhance}</span>
                      )}
                      {worn.has(owned.uid) && (
                        <span className="text-ink-disabled"> · 착용 중</span>
                      )}
                    </p>
                    {def.effect && (
                      <p className="mt-1 font-display text-[11px] text-ink-muted">
                        지금 +{effectPercent(def, owned.enhance).toFixed(0)}% →
                        벼리면 +
                        {effectPercent(def, owned.enhance + 1).toFixed(0)}%
                      </p>
                    )}
                  </div>

                  <PixelButton
                    variant="ghost"
                    onClick={() => onEnhance(owned.uid)}
                    className="shrink-0 px-2.5 py-1 text-[11px] shadow-pixel-sm"
                  >
                    벼리기
                  </PixelButton>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
