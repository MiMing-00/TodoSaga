'use client';

import {
  ALL_EQUIP_SLOTS,
  equippedUids,
  itemOf,
  type Equipped,
  type OwnedItem,
} from '@/lib/inventory';
import {
  SLOT_LABEL,
  TOOL_SLOTS,
  canEquip,
  effectPercent,
  type EquipContext,
  type Item,
  type ItemAxis,
} from '@/lib/items';
import { RANK } from '@/lib/quest';
import { CLASSES } from '@/lib/sprite';
import { sellValue } from '@/lib/shop';
import { useState } from 'react';
import { Chip, Panel, PixelButton } from './Pixel';

type Tab = ItemAxis;

const TABS: { key: Tab; label: string }[] = [
  { key: 'equipment', label: '장비' },
  { key: 'cosmetic', label: '치장' },
  { key: 'tool', label: '도구' },
];

export function Inventory({
  inventory,
  equipped,
  ctx,
  onEquip,
  onUnequip,
  onSell,
}: {
  inventory: OwnedItem[];
  equipped: Equipped;
  ctx: EquipContext;
  onEquip: (uid: string) => string | null;
  onUnequip: (uid: string) => void;
  onSell: (uid: string) => string | null;
}) {
  const [tab, setTab] = useState<Tab>('equipment');
  const [notice, setNotice] = useState<string | null>(null);

  const worn = new Set(equippedUids(equipped));
  const list = inventory.filter((o) => itemOf(o)?.axis === tab);

  return (
    <Panel
      title="봇짐"
      right={
        <span className="font-display text-[10px] text-canvas/70">
          {inventory.length}종
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <SlotRow equipped={equipped} inventory={inventory} onUnequip={onUnequip} />

        {/* 탭 */}
        <ul className="flex gap-1.5 border-t-2 border-ink pt-3">
          {TABS.map((t) => (
            <li key={t.key} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setNotice(null);
                }}
                aria-pressed={tab === t.key}
                className={`press w-full border-2 py-1.5 font-display text-[11px] ${
                  tab === t.key
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-ink bg-surface text-ink-muted'
                }`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        {notice && (
          <p className="border-2 border-danger bg-surface px-3 py-2 font-display text-[11px] text-danger">
            ! {notice}
          </p>
        )}

        {list.length === 0 ? (
          <p className="border-2 border-dashed border-ink-disabled px-4 py-8 text-center text-xs text-ink-muted">
            아직 비어 있어요. 의뢰를 완수하면 하나씩 쌓입니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map((owned) => (
              <ItemRow
                key={owned.uid}
                owned={owned}
                worn={worn.has(owned.uid)}
                ctx={ctx}
                onEquip={() => {
                  const err = onEquip(owned.uid);
                  setNotice(err);
                }}
                onUnequip={() => {
                  onUnequip(owned.uid);
                  setNotice(null);
                }}
                onSell={() => setNotice(onSell(owned.uid))}
              />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/** 장착 슬롯 한눈에 보기 */
function SlotRow({
  equipped,
  inventory,
  onUnequip,
}: {
  equipped: Equipped;
  inventory: OwnedItem[];
  onUnequip: (uid: string) => void;
}) {
  const nameOf = (uid?: string) => {
    if (!uid) return null;
    const owned = inventory.find((o) => o.uid === uid);
    const def = owned && itemOf(owned);
    if (!def) return null;
    return def.axis === 'equipment' && owned.enhance > 0
      ? `${def.name} +${owned.enhance}`
      : def.name;
  };

  const tools = equipped.tools ?? [];

  return (
    <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {ALL_EQUIP_SLOTS.map((slot) => {
        const uid = equipped[slot];
        const name = nameOf(uid);
        return (
          <li key={slot}>
            <button
              type="button"
              disabled={!uid}
              onClick={() => uid && onUnequip(uid)}
              className={`press flex w-full flex-col items-start gap-0.5 border-2 px-2 py-1.5 text-left ${
                name ? 'border-ink bg-surface' : 'border-ink-disabled bg-sunken'
              }`}
            >
              <span className="font-display text-[9px] text-ink-disabled">
                {SLOT_LABEL[slot]}
              </span>
              <span
                className={`w-full truncate font-display text-[11px] ${
                  name ? 'text-ink' : 'text-ink-disabled'
                }`}
              >
                {name ?? '비어 있음'}
              </span>
            </button>
          </li>
        );
      })}

      {Array.from({ length: TOOL_SLOTS }, (_, i) => {
        const uid = tools[i];
        const name = nameOf(uid);
        return (
          <li key={`tool-${i}`}>
            <button
              type="button"
              disabled={!uid}
              onClick={() => uid && onUnequip(uid)}
              className={`press flex w-full flex-col items-start gap-0.5 border-2 px-2 py-1.5 text-left ${
                name ? 'border-primary bg-tint-lavender' : 'border-ink-disabled bg-sunken'
              }`}
            >
              <span className="font-display text-[9px] text-ink-disabled">
                도구 {i + 1}
              </span>
              <span
                className={`w-full truncate font-display text-[11px] ${
                  name ? 'text-cha' : 'text-ink-disabled'
                }`}
              >
                {name ?? '비어 있음'}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ItemRow({
  owned,
  worn,
  ctx,
  onEquip,
  onUnequip,
  onSell,
}: {
  owned: OwnedItem;
  worn: boolean;
  ctx: EquipContext;
  onEquip: () => void;
  onUnequip: () => void;
  onSell: () => void;
}) {
  // 파는 건 되돌릴 수 없다. 퀘스트 삭제와 같은 인라인 2단계 확인
  const [confirming, setConfirming] = useState(false);

  const def = itemOf(owned);
  if (!def) return null;

  const check = canEquip(def, ctx);
  const rank = RANK[def.rank] ?? RANK.F;
  const price = sellValue(def, owned.enhance);

  return (
    <li
      className={`flex items-start gap-3 border-2 p-2.5 ${
        worn ? 'border-primary bg-tint-lavender' : 'border-ink bg-surface'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm ${rank.badge}`}
      >
        {def.rank}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-[13px] break-keep text-ink">
          {def.name}
          {def.axis === 'equipment' && owned.enhance > 0 && (
            <span className="text-primary"> +{owned.enhance}</span>
          )}
          {def.consumable && owned.count > 1 && (
            <span className="text-ink-muted"> ×{owned.count}</span>
          )}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {def.classLock && (
            <Chip className="border-ink bg-tint-lavender text-cha">
              {CLASSES[def.classLock].name} 전용
            </Chip>
          )}
          {def.effect && (
            <Chip className="border-ink bg-tint-mint text-exp">
              {effectLabel(def)} +{effectPercent(def, owned.enhance).toFixed(0)}%
            </Chip>
          )}
          {def.axis === 'tool' && !def.consumable && (
            <Chip className="border-ink bg-tint-sky text-int">AI 보조</Chip>
          )}
        </div>

        <p className="mt-1.5 text-[11px] leading-relaxed break-keep text-ink-muted">
          {def.desc}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {!def.consumable &&
          (worn ? (
            <PixelButton
              variant="ghost"
              onClick={onUnequip}
              className="px-2.5 py-1 text-[11px] shadow-pixel-sm"
            >
              해제
            </PixelButton>
          ) : check.ok ? (
            <PixelButton
              onClick={onEquip}
              className="px-2.5 py-1 text-[11px] shadow-pixel-sm"
            >
              장착
            </PixelButton>
          ) : (
            <span className="border-2 border-ink-disabled bg-sunken px-2 py-1 text-center font-display text-[10px] text-ink-disabled">
              {check.reason}
            </span>
          ))}

        {/* 장착 중이 아니면 언제든 팔 수 있다.
            더 좋은 게 나왔거나 전직으로 못 쓰게 된 물건이 짐으로 남으면 안 된다 */}
        {!worn &&
          (confirming ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onSell();
                  setConfirming(false);
                }}
                className="press border-2 border-gold-ink bg-tint-yellow px-1.5 py-0.5 font-display text-[10px] text-gold-ink"
              >
                {price.toLocaleString()} G에 판다
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="press border-2 border-ink-disabled bg-surface px-1.5 py-0.5 font-display text-[10px] text-ink-muted"
              >
                취소
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="press border-2 border-ink-disabled bg-surface px-2 py-1 font-display text-[10px] text-ink-muted"
            >
              판매 {price.toLocaleString()} G
            </button>
          ))}
      </div>
    </li>
  );
}

function effectLabel(item: Item): string {
  const e = item.effect;
  if (!e) return '';
  if (e.kind === 'gold') return '골드';
  if (e.kind === 'exp') return 'EXP';
  return `${e.category} EXP`;
}
