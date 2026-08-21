'use client';

import { getItem } from '@/lib/items';
import type { OwnedItem } from '@/lib/inventory';
import {
  PET_LIMIT,
  affectionName,
  buildNabi,
  claimableAffection,
  nextAffection,
} from '@/lib/nabi';
import { NABI, NABI_DOZE, NABI_STRETCH } from '@/lib/sprite';
import { NABI_LIMIT_LINES, NABI_LINES, pickLine } from './nabiLines';
import { useEffect, useRef, useState } from 'react';
import { Panel, PixelButton } from './Pixel';
import { PixelSprite } from './PixelSprite';

/** 나비와 얼마나 친해졌는지, 그리고 무엇을 입혔는지 */
export function NabiPanel({
  affection,
  claimed,
  petsToday,
  inventory,
  furId,
  accessoryId,
  onClaim,
  onDress,
  onPet,
}: {
  affection: number;
  claimed: number[];
  petsToday: number;
  inventory: OwnedItem[];
  furId: string | null;
  accessoryId: string | null;
  onClaim: (at: number) => void;
  onDress: (itemId: string) => void;
  /** 좁은 화면에는 배경 나비가 없다. 여기서 직접 쓰다듬는다 */
  onPet: () => boolean;
}) {
  const [bubble, setBubble] = useState<string | null>(null);
  const [pose, setPose] = useState<'sit' | 'doze' | 'stretch'>('doze');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function pet() {
    const ok = onPet();
    const line = ok
      ? pickLine(NABI_LINES[pose === 'doze' ? 'doze' : 'sit'], bubble)
      : pickLine(NABI_LIMIT_LINES, bubble);

    setPose(pose === 'doze' ? 'stretch' : 'sit');
    setBubble(line);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setBubble(null);
      setPose('doze');
    }, 2200);
  }
  const grid =
    pose === 'doze' ? NABI_DOZE : pose === 'stretch' ? NABI_STRETCH : NABI;
  const nabi = buildNabi(grid, furId, accessoryId);
  const ready = claimableAffection(affection, claimed);
  const next = nextAffection(claimed);
  const owned = inventory.filter((o) => getItem(o.itemId)?.axis === 'nabi');
  const remaining = Math.max(PET_LIMIT - petsToday, 0);


  return (
    <Panel title="나비">
      <div className="flex flex-col gap-4">
        {/* 나비의 자리.
            말풍선을 띄워서 옆을 가리는 대신 **자리를 가로로 길게 잡고**
            말을 그 안에 들인다. 아무 말이 없을 때도 높이를 그대로 두어
            말할 때마다 아래 내용이 밀려 내려가지 않게 한다 */}
        <button
          type="button"
          onClick={pet}
          aria-label="나비를 쓰다듬기"
          title={`나비를 쓰다듬기 (오늘 ${remaining}번 남음)`}
          className="press flex min-h-[84px] w-full items-center gap-3 border-2 border-ink bg-sunken px-3 py-2.5 text-left"
        >
          <span className="animate-float shrink-0">
            <PixelSprite layers={nabi.layers} palette={nabi.palette} size={60} />
          </span>
          <span className="min-w-0 flex-1">
            {bubble ? (
              <span className="block border-2 border-ink bg-surface px-2.5 py-2 font-display text-[11px] leading-relaxed break-keep text-ink shadow-pixel-sm">
                {bubble}
              </span>
            ) : (
              <span className="block font-display text-[11px] leading-relaxed break-keep text-ink-muted">
                눌러서 쓰다듬어 주세요
                <span className="mt-1 block text-[10px] text-ink-disabled">
                  {remaining > 0
                    ? `오늘 ${remaining}번 더 만질 수 있습니다`
                    : '오늘 몫은 모두 쓰셨습니다'}
                </span>
              </span>
            )}
          </span>
        </button>

        <div className="flex items-end justify-between gap-3 border-2 border-ink bg-surface px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-display text-[11px] text-ink-muted">호감도</p>
            <p className="mt-1 font-display text-lg break-keep text-ink">
              {affectionName(affection)}
            </p>
          </div>
          {/* 상한을 보여주지 않는다. 끝이 보이면 '만렙 찍었으니 그만'이 된다 */}
          <p className="shrink-0 font-display text-[11px] text-ink-muted">
            <span className="tabular-nums text-ink">{affection}</span>
            <span className="text-ink-disabled"> / ???</span>
          </p>
        </div>

        <p className="text-xs leading-relaxed break-keep text-ink-muted sm:block hidden">
          넓은 화면에서는 배경을 거니는 나비를 직접 만질 수도 있습니다.
        </p>

        {ready.map((level) => (
          <div
            key={level.at}
            className="flex items-center gap-2 border-2 border-primary bg-tint-lavender px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-[12px] text-primary">
                {level.name}
              </p>
              <p className="mt-1 text-[11px] break-keep text-ink-muted">
                {level.desc} · +{level.gold.toLocaleString()} G
                {level.scales && ` · 나비의 털 +${level.scales}`}
              </p>
            </div>
            <PixelButton
              variant="reward"
              onClick={() => onClaim(level.at)}
              className="shrink-0 px-3 py-2 text-[11px]"
            >
              받기
            </PixelButton>
          </div>
        ))}

        {next && (
          <p className="font-display text-[11px] break-keep text-ink-muted">
            다음 단계 「{next.name}」까지{' '}
            <span className="tabular-nums text-ink">
              {Math.max(next.at - affection, 0)}
            </span>
          </p>
        )}

        {/* 꾸미기 */}
        <div className="border-t-2 border-ink pt-3">
          <p className="mb-2 font-display text-[11px] text-ink">꾸미기</p>
          {owned.length === 0 ? (
            <p className="border-2 border-dashed border-ink-disabled px-3 py-4 text-center text-xs break-keep text-ink-muted">
              「나비의 상자」에서 아주 가끔 나비의 물건이 나옵니다.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {owned.map((o) => {
                const def = getItem(o.itemId)!;
                const on = furId === def.id || accessoryId === def.id;
                return (
                  <li key={o.uid}>
                    <button
                      type="button"
                      onClick={() => onDress(def.id)}
                      aria-pressed={on}
                      className={`press border-2 px-2 py-1.5 font-display text-[11px] ${
                        on
                          ? 'border-primary bg-tint-lavender text-primary'
                          : 'border-ink bg-surface text-ink-muted'
                      }`}
                    >
                      {def.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}
