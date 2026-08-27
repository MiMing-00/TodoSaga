'use client';

import type { CosmeticArt } from '@/lib/cosmetics';
import type { Category } from '@/lib/quest';
import { buildCharacterLayers } from '@/lib/sprite';
import { LoreTip } from './LoreTip';
import { PixelSprite } from './PixelSprite';

/**
 * 상태 판.
 *
 * 화면 위에 헤더로 매달지 않는다. 길찾기(사이드바 / 하단 탭)에 붙여서
 * **화면 위쪽은 내용에게 온전히 내준다.**
 *
 *   side  — 넓은 화면: 사이드바 아래에 세로로
 *   strip — 좁은 화면: 하단 탭 바로 위에 가로로
 */
const EXP_CELLS = 10;

export function StatusPlate({
  variant,
  level,
  expInCurrent,
  expToNext,
  gold,
  streak,
  charClass,
  cosmetics = [],
}: {
  variant: 'side' | 'strip';
  level: number;
  expInCurrent: number;
  expToNext: number;
  gold: number;
  streak: number;
  charClass: Category | 'NONE';
  cosmetics?: CosmeticArt[];
}) {
  const dressed = buildCharacterLayers(charClass, cosmetics);
  const filled = Math.round((expInCurrent / expToNext) * EXP_CELLS);

  const sprite = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-sunken">
      <PixelSprite layers={dressed.layers} palette={dressed.palette} size={30} />
    </span>
  );

  const gauge = (
    <span className="flex gap-[2px] border-2 border-ink bg-sunken p-[2px]">
      {Array.from({ length: EXP_CELLS }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 ${i < filled ? 'bg-exp' : 'bg-transparent'}`}
        />
      ))}
    </span>
  );

  const coins = (
    <span className="inline-flex items-center gap-1 font-display text-[11px] text-gold-ink">
      <span
        className="inline-block h-2.5 w-2.5 border border-gold-ink bg-gold"
        aria-hidden
      />
      <span className="tabular-nums">{gold.toLocaleString()}</span>
    </span>
  );

  const fire = streak > 0 && (
    <LoreTip
      plain
      hint={`불씨 ${streak}일째. 매일 다시 켜야 이어진다 — 밝을수록 녹이 옅어진다.`}
    >
      <span className="inline-flex items-center gap-0.5 font-display text-[11px] text-ink">
        <span aria-hidden>🔥</span>
        <span className="tabular-nums">{streak}</span>
      </span>
    </LoreTip>
  );

  if (variant === 'side') {
    return (
      <div className="flex flex-col gap-2 border-2 border-ink bg-surface p-2.5 shadow-pixel-sm">
        <div className="flex items-center gap-2">
          {sprite}
          <span className="flex min-w-0 flex-col gap-0.5 font-display leading-none">
            <span className="text-[13px] text-primary">LV.{level}</span>
            <span className="text-[10px] tabular-nums text-ink-muted">
              {expInCurrent} / {expToNext}
            </span>
          </span>
        </div>

        {gauge}

        <div className="flex items-center justify-between gap-2 border-t-2 border-ink-disabled pt-2">
          {coins}
          {fire}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 border-t-2 border-ink-disabled bg-canvas px-4 py-2">
      {sprite}

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline gap-2 font-display leading-none">
          <span className="text-[12px] text-primary">LV.{level}</span>
          <span className="text-[10px] tabular-nums text-ink-muted">
            {expInCurrent} / {expToNext}
          </span>
        </span>
        {gauge}
      </span>

      <span className="flex shrink-0 items-center gap-2.5">
        {fire}
        {coins}
      </span>
    </div>
  );
}
