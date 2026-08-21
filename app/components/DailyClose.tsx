'use client';

import { formatKorean } from '@/lib/date';
import type { DaySummary } from '@/lib/daily';
import { CATEGORY } from '@/lib/quest';
import { PixelButton, SegmentGauge } from './Pixel';

/**
 * 하루 마감.
 *
 * 이 앱에는 시작만 있고 끝이 없었다. 여기서 하루가 닫히고,
 * 그동안 표시만 되던 `debuff`가 처음으로 실제 효과를 갖는다.
 *
 * 페널티는 **가볍게 놀리는 수준**으로 둔다. 아프면 앱을 안 열게 되고,
 * 그러면 루틴 앱으로서 실패다. 연속 기록은 건드리지 않는다.
 */
export function DailyClose({
  summary,
  onClose,
}: {
  summary: DaySummary;
  onClose: () => void;
}) {
  const allDone = summary.missed.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-conic-gradient(#2E2A24 0% 25%, rgba(0,0,0,0) 0% 50%)',
          backgroundSize: '4px 4px',
        }}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="하루 마감"
        className="relative my-auto w-full max-w-md border-[3px] border-ink bg-surface shadow-pixel"
      >
        <header className="border-b-[3px] border-ink bg-ink px-3 py-2">
          <p className="font-display text-[13px] text-canvas">
            ▸ 오늘의 장이 닫힙니다
          </p>
        </header>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <p className="font-display text-[11px] text-ink-muted">
            {formatKorean(summary.date)}
          </p>

          {/* 완료 진행도 */}
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-2 font-display text-xs">
              <span className="text-ink">완수한 의뢰</span>
              <span className="tabular-nums text-ink-muted">
                {summary.done} / {summary.total}
              </span>
            </div>
            <SegmentGauge
              value={summary.done}
              max={summary.total}
              segments={Math.min(summary.total, 12)}
              fill="bg-primary"
            />
          </div>

          {/* 얻은 것 */}
          <div className="border-2 border-ink bg-sunken px-3 py-2.5">
            <p className="mb-2 font-display text-[11px] text-ink-muted">
              오늘 거둔 것
            </p>
            <div className="flex flex-wrap gap-2 font-display text-sm">
              <span className="text-exp tabular-nums">+{summary.exp} EXP</span>
              <span className="text-gold-ink tabular-nums">
                +{summary.gold} G
              </span>
            </div>
          </div>

          {/* 놓친 것 */}
          {allDone ? (
            <div className="border-2 border-ink bg-tint-mint px-3 py-3 text-center">
              <p className="font-display text-[13px] text-exp">
                한 건도 흘리지 않았습니다
              </p>
              <p className="mt-1.5 text-xs break-keep text-ink-muted">
                오늘의 장은 흠 없이 닫혔어요.
              </p>
            </div>
          ) : (
            <div>
              <p className="mb-2 font-display text-[11px] text-ink-muted">
                놓친 의뢰 {summary.missed.length}건
              </p>
              <ul className="flex flex-col gap-2">
                {summary.missed.map((quest, i) => {
                  const cat = CATEGORY[quest.category] ?? CATEGORY.STR;
                  return (
                    <li
                      key={`${quest.title}-${i}`}
                      className="border-2 border-ink-disabled bg-tint-gray px-2.5 py-2"
                    >
                      <p className="font-display text-[12px] break-keep text-ink-muted">
                        <span className={cat.ink}>{cat.name}</span> {quest.title}
                      </p>
                      {quest.debuff && (
                        <p className="mt-1 text-[11px] leading-relaxed break-keep text-danger">
                          → {quest.debuff}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {summary.debuffPercent > 0 && (
                <p className="mt-2.5 border-2 border-danger bg-surface px-2.5 py-2 font-display text-[11px] leading-relaxed break-keep text-danger">
                  놓친 의뢰가 그림자로 남아, 내일 하루 EXP가{' '}
                  {summary.debuffPercent}% 줄어듭니다.
                  <span className="mt-1 block text-ink-muted">
                    불씨는 꺼지지 않았어요.
                  </span>
                </p>
              )}
            </div>
          )}

          <PixelButton onClick={onClose} className="w-full py-3 text-sm">
            다음 장으로
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
