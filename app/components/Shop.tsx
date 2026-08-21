'use client';

import { effectPercent, SLOT_LABEL, type ItemAxis } from '@/lib/items';
import type { OwnedItem } from '@/lib/inventory';
import { RANK, type Category } from '@/lib/quest';
import { CLASSES } from '@/lib/sprite';
import { DEAL_OFF, dealItemId, shopAxes, shopEntries } from '@/lib/shop';
import { todayKey } from '@/lib/date';
import { useState } from 'react';
import { Chip, Panel, PixelButton } from './Pixel';

const AXIS_LABEL: Record<ItemAxis, string> = {
  tool: '도구',
  cosmetic: '치장',
  equipment: '장비',
  nabi: '나비',
};

/**
 * 상점.
 *
 * 장비는 팔지 않는다 — 돈으로 강해지는 길을 열면 퀘스트를 완료할 이유가 줄어든다.
 * 파는 건 겉모습(치장)과 **AI를 바꾸는 도구**뿐이다.
 *
 * 사고 싶게 만드는 건 물건 목록이 아니라 **살 이유**다. 그래서 세 가지를 둔다.
 *  - 하루에 하나만 값을 깎는다. 오늘 안 사면 내일은 제값이다.
 *  - 못 사는 물건에도 **얼마가 모자란지** 적는다. 회색 가격표만 있으면 포기한다.
 *  - 도구에는 **무엇이 달라지는지**를 값 대신 문장으로 적는다.
 */
const KEEPER_LINES = [
  '오래 걸었습니다. 좋은 것만 골라 왔지요.',
  '오늘 들어온 물건입니다. 내일은 없습니다.',
  '값은 붙어 있는 대로입니다. 흥정은 사양하겠습니다.',
  '용사님 눈이 높으시군요. 그럼 이쪽을.',
];

/** 날짜가 같으면 같은 인사를 한다 — 새로고침할 때마다 말이 바뀌면 사람 같지 않다 */
function keeperLine(date: string): string {
  let h = 0;
  for (let i = 0; i < date.length; i += 1) h = (h * 31 + date.charCodeAt(i)) | 0;
  return KEEPER_LINES[Math.abs(h) % KEEPER_LINES.length];
}
export function Shop({
  gold,
  charClass,
  inventory,
  onBuy,
}: {
  gold: number;
  charClass: Category | 'NONE';
  inventory: OwnedItem[];
  onBuy: (itemId: string) => string | null;
}) {
  const today = todayKey();
  const axes = shopAxes(charClass, inventory);
  const [axis, setAxis] = useState<ItemAxis>(axes[0] ?? 'tool');
  const [notice, setNotice] = useState<string | null>(null);

  const entries = shopEntries(charClass, inventory, axis, today);

  // 오늘의 매물이 다른 탭에 있으면 여기서는 할인이 있는 줄도 모른다
  const dealId = dealItemId(charClass, today);
  const dealAxis = dealId ? shopEntries(charClass, inventory, undefined, today)
    .find((e) => e.item.id === dealId && !e.owned)?.item.axis ?? null : null;

  return (
    <Panel
      title="떠돌이 상단"
      right={
        <span className="font-display text-[10px] tabular-nums text-canvas/70">
          {gold.toLocaleString()} G
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="border-2 border-ink bg-sunken px-2.5 py-2 font-display text-[11px] leading-relaxed break-keep text-ink-muted">
          “{keeperLine(today)}”
        </p>

        <ul className="flex gap-1.5">
          {axes.map((a) => (
            <li key={a} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  setAxis(a);
                  setNotice(null);
                }}
                aria-pressed={axis === a}
                className={`press relative w-full border-2 py-1.5 font-display text-[11px] ${
                  axis === a
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-ink bg-surface text-ink-muted'
                }`}
              >
                {AXIS_LABEL[a]}
                {dealAxis === a && axis !== a && (
                  <span
                    aria-label="오늘의 매물 있음"
                    className="absolute top-1 right-1 h-1.5 w-1.5 bg-primary"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        {notice && (
          <p className="border-2 border-danger bg-surface px-3 py-2 font-display text-[11px] text-danger">
            ! {notice}
          </p>
        )}

        {axis === 'tool' && (
          <p className="border-2 border-ink bg-tint-sky px-2.5 py-2 text-xs leading-relaxed break-keep text-ink">
            도구는 나비가 의뢰서를 쓰는 방식을 바꿉니다. 몸에 지닐 수 있는 건
            한 번에 두 개까지.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {entries.map(({ item, price, wasPrice, owned }) => {
            const rank = RANK[item.rank] ?? RANK.F;
            const affordable = gold >= price;
            const short = price - gold;

            return (
              <li
                key={item.id}
                className={`relative flex items-start gap-3 border-2 p-2.5 ${
                  owned
                    ? 'border-ink-disabled bg-sunken'
                    : wasPrice
                      ? 'border-[3px] border-primary bg-surface'
                      : 'border-ink bg-surface'
                }`}
              >
                {wasPrice && !owned && (
                  <span className="absolute -top-2.5 left-2 border-2 border-ink bg-primary px-1.5 py-px font-display text-[9px] text-white">
                    오늘의 매물 −{Math.round(DEAL_OFF * 100)}%
                  </span>
                )}
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm ${rank.badge}`}
                >
                  {item.rank}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-display text-[13px] break-keep ${
                      owned ? 'text-ink-disabled' : 'text-ink'
                    }`}
                  >
                    {item.name}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <Chip className="border-ink bg-sunken text-ink-muted">
                      {SLOT_LABEL[item.slot]}
                    </Chip>
                    {item.classLock && (
                      <Chip className="border-ink bg-sunken text-ink-muted">
                        {CLASSES[item.classLock].name} 전용
                      </Chip>
                    )}
                    {item.effect && (
                      <Chip className="border-ink bg-surface text-ink">
                        +{effectPercent(item, 0).toFixed(0)}%
                      </Chip>
                    )}
                    {item.consumable && (
                      <Chip className="border-ink bg-sunken text-ink-muted">
                        소모품
                      </Chip>
                    )}
                  </div>

                  <p className="mt-1.5 text-[11px] leading-relaxed break-keep text-ink-muted">
                    {item.desc}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="flex flex-col items-end leading-none">
                    {wasPrice && (
                      <span className="font-display text-[10px] tabular-nums text-ink-disabled line-through">
                        {wasPrice.toLocaleString()} G
                      </span>
                    )}
                    <span
                      className={`font-display text-[11px] tabular-nums ${
                        affordable && !owned ? 'text-gold-ink' : 'text-ink-disabled'
                      }`}
                    >
                      {price.toLocaleString()} G
                    </span>
                    {/* 회색 가격표만 있으면 그냥 포기한다. 얼마 남았는지 알려 준다 */}
                    {!owned && !affordable && (
                      <span className="mt-1 font-display text-[9px] tabular-nums text-ink-muted">
                        {short.toLocaleString()} G 더
                      </span>
                    )}
                  </span>

                  {owned ? (
                    <span className="border-2 border-ink-disabled bg-sunken px-2 py-1 font-display text-[10px] text-ink-disabled">
                      보유 중
                    </span>
                  ) : (
                    <PixelButton
                      onClick={() => setNotice(onBuy(item.id))}
                      disabled={!affordable}
                      className="px-2.5 py-1 text-[11px] shadow-pixel-sm"
                    >
                      구매
                    </PixelButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
