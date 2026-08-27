'use client';

import { CATEGORY, CATEGORY_ORDER } from '@/lib/quest';
import { UNLOCK_STAT } from '@/lib/sprite';
import type { Stats } from '@/lib/store';
import { LoreTip } from './LoreTip';

/**
 * 다섯 능력치의 누적 경험치.
 * 막대는 '가장 높은 능력치' 대비 상대값이다 — 절대 상한이 없으므로
 * 지금 내가 어느 쪽으로 치우쳐 있는지를 보여주는 게 목적이다.
 */
export function StatPanel({ stats }: { stats: Stats }) {
  const max = Math.max(1, ...CATEGORY_ORDER.map((c) => stats[c] ?? 0));
  const total = CATEGORY_ORDER.reduce((sum, c) => sum + (stats[c] ?? 0), 0);

  return (
    <div className="border-[3px] border-ink bg-surface p-4 shadow-pixel sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2 font-display text-[11px] sm:text-xs">
        <span className="text-ink">
          <LoreTip hint="매일 그 자리에 다시 서는 사람. 특별한 일을 해내서가 아니라 매일 다시 서기 때문에 용사다.">
            용사
          </LoreTip>
          의 자질
        </span>
        <span className="tabular-nums text-ink-muted">누적 {total}</span>
      </div>

      <ul className="flex flex-col gap-2">
        {CATEGORY_ORDER.map((key) => {
          const cat = CATEGORY[key];
          const value = stats[key] ?? 0;
          const ratio = value / max;
          return (
            <li key={key} className="flex items-center gap-2.5">
              <span
                className={`flex w-[92px] shrink-0 items-baseline gap-1 font-display text-[11px] sm:w-[104px] sm:text-xs ${
                  value > 0 ? cat.ink : 'text-ink-disabled'
                }`}
              >
                <span aria-hidden>{cat.icon}</span>
                <LoreTip hint={cat.lore}>{cat.name}</LoreTip>
                <span className="text-[9px] text-ink-disabled">{cat.label}</span>
              </span>

              <div className="flex h-3.5 flex-1 border-2 border-ink bg-sunken p-[2px]">
                <div
                  className={`h-full ${cat.bar}`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>

              {/* 해금 전에는 목표치를 같이 보여줘야 '얼마나 남았는지'가 읽힌다 */}
              <span className="w-14 shrink-0 text-right font-display text-[11px] tabular-nums sm:text-xs">
                {value >= UNLOCK_STAT ? (
                  <span className={cat.ink}>{value}</span>
                ) : (
                  <span className="text-ink-muted">
                    {value}
                    <span className="text-ink-disabled">/{UNLOCK_STAT}</span>
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {total === 0 && (
        <p className="mt-3 text-xs text-ink-muted">
          의뢰를 완수할 때마다 그 자질이 자랍니다. 하나가 {UNLOCK_STAT}에 이르면
          그 길의 직업이 열려요.
        </p>
      )}
    </div>
  );
}
