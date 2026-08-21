'use client';

import { claimableRewards, nextReward } from '@/lib/daily';
import { lastNDays, todayKey, weekdayOf } from '@/lib/date';
import { getItem } from '@/lib/items';
import type { Quest } from '@/lib/quest';
import { Chip, PixelButton } from './Pixel';

/**
 * 연속 기록 + 최근 7일 도트.
 * 루틴 앱의 핵심 지표라 퀘스트 목록보다 위에 둔다.
 */
export function StreakStrip({
  streak,
  bestStreak,
  days,
  claimed,
  onClaim,
}: {
  streak: number;
  bestStreak: number;
  days: Record<string, Quest[]>;
  claimed: number[];
  onClaim: (days: number) => void;
}) {
  const ready = claimableRewards(bestStreak, claimed);
  const next = nextReward(claimed);
  const today = todayKey();
  const week = lastNDays(7);

  return (
    <div className="border-[3px] border-ink bg-surface p-4 shadow-pixel sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2 font-display text-[11px] sm:text-xs">
        <span className="text-ink">
          {streak > 0 ? (
            <>
              <span aria-hidden>🔥</span> 불씨 {streak}일째
            </>
          ) : (
            '불씨가 꺼져 있어요'
          )}
        </span>
        <span className="tabular-nums text-ink-muted">
          가장 길었던 불씨 {bestStreak}일
        </span>
      </div>

      <ul className="flex gap-1.5">
        {week.map((key) => {
          const cleared = (days[key] ?? []).some((q) => q.completed);
          const isToday = key === today;
          return (
            <li key={key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-7 w-full border-2 sm:h-8 ${
                  cleared
                    ? 'border-ink bg-primary'
                    : isToday
                      ? 'animate-blink border-primary bg-sunken'
                      : 'border-ink-disabled bg-sunken'
                }`}
                title={key}
              />
              <span
                className={`font-display text-[10px] ${
                  isToday ? 'text-primary' : 'text-ink-disabled'
                }`}
              >
                {weekdayOf(key)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-ink-muted">
        {streak > 0
          ? '하루에 의뢰 하나만 완수해도 불씨는 이어집니다.'
          : '오늘 의뢰 하나만 완수하면 다시 불이 붙어요.'}
      </p>

      {/* 시간으로 살 수 없는 유일한 조건이라 최고 등급 보상을 여기에 건다 */}
      <div className="mt-3 flex flex-col gap-2 border-t-2 border-ink pt-3">
        {ready.map((reward) => (
          <div
            key={reward.days}
            className="flex items-center gap-2 border-2 border-primary bg-tint-lavender px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-[12px] text-primary">
                {reward.days}일 — {reward.label}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-ink-muted">
                <span className="tabular-nums text-gold-ink">
                  +{reward.gold.toLocaleString()} G
                </span>
                {reward.scales && <span>나비의 털 +{reward.scales}</span>}
                {reward.itemId && (
                  <Chip className="border-ink bg-surface text-ink">
                    {getItem(reward.itemId)?.name}
                  </Chip>
                )}
              </p>
            </div>
            <PixelButton
              variant="reward"
              onClick={() => onClaim(reward.days)}
              className="shrink-0 px-3 py-2 text-[11px]"
            >
              받기
            </PixelButton>
          </div>
        ))}

        {next ? (
          <p className="font-display text-[11px] break-keep text-ink-muted">
            다음 보상 「{next.label}」까지{' '}
            <span className="tabular-nums text-ink">
              {Math.max(next.days - bestStreak, 0)}일
            </span>
          </p>
        ) : (
          <p className="font-display text-[11px] text-ink-muted">
            모든 보상을 받았습니다.
          </p>
        )}
      </div>
    </div>
  );
}
