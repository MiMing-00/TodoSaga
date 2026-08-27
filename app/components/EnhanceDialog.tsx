'use client';

import type { OwnedItem } from '@/lib/inventory';
import {
  MAX_ENHANCE,
  PROTECT_PRICE,
  effectPercent,
  enhanceCost,
  enhanceOdds,
  getItem,
} from '@/lib/items';
import { RANK } from '@/lib/quest';
import { PROTECT_SHARDS, type EnhanceResult, type ProtectMode } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import { Chip, PixelButton } from './Pixel';

/**
 * 장비 강화.
 *
 * 결과를 기다리는 순간이 재미의 절반이다. 즉시 숫자만 바뀌면 도박도 성취도 아니다.
 * **긴장 → 판정 → 결과** 세 단계로 나누고, 세 결과는 색이 아니라
 * **움직임의 축**으로 구분한다 (성공 ↑ / 유지 ↔ / 파괴 ↓).
 */
type Phase = 'idle' | 'tense' | 'judge' | 'done';

export function EnhanceDialog({
  owned,
  gold,
  shards,
  onEnhance,
  onClose,
}: {
  owned: OwnedItem;
  gold: number;
  shards: number;
  onEnhance: (protect: ProtectMode) => EnhanceResult | { error: string };
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [protect, setProtect] = useState<ProtectMode>('none');
  const [result, setResult] = useState<EnhanceResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const def = getItem(owned.itemId);
  if (!def) return null;

  const maxed = owned.enhance >= MAX_ENHANCE;
  const next = owned.enhance + 1;
  const cost = maxed ? 0 : enhanceCost(def.rank, next);
  const odds = enhanceOdds(Math.min(next, MAX_ENHANCE));
  const bonus = owned.fails * 0.05;
  const success = Math.min(odds.success + bonus, 1);
  const rest = Math.max(0, 1 - success);
  const share = odds.keep + odds.destroy;
  const destroyRate =
    protect === 'none' && share > 0 ? rest * (odds.destroy / share) : 0;
  const risky = odds.destroy > 0;

  const protectGold = PROTECT_PRICE[def.rank];
  const total = cost + (protect === 'gold' ? protectGold : 0);
  const affordable =
    gold >= total && (protect !== 'shards' || shards >= PROTECT_SHARDS);

  const destroyed = phase === 'done' && result?.kind === 'destroy';

  function run() {
    const outcome = onEnhance(protect);
    if ('error' in outcome) {
      setNotice(outcome.error);
      setConfirming(false);
      return;
    }

    setNotice(null);
    setConfirming(false);
    setResult(outcome);

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setPhase('done');
      return;
    }

    setPhase('tense');
    timers.current = [
      setTimeout(() => setPhase('judge'), 700),
      setTimeout(() => setPhase('done'), 800),
    ];
  }

  const busy = phase === 'tense' || phase === 'judge';

  return (
    /* 바깥은 스크롤하지 않는다 — 여기가 스크롤되면 오버레이가 첫 화면만 덮는다 */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-conic-gradient(#2E2A24 0% 25%, rgba(0,0,0,0) 0% 50%)',
          backgroundSize: '4px 4px',
        }}
        aria-hidden
      />

      {/* 파괴만 화면 전체가 반응한다 — 셋 중 유일하게 카드 단위를 벗어난다 */}
      {destroyed && (
        <div
          className="animate-screen-flash-danger pointer-events-none absolute inset-0"
          aria-hidden
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="장비 강화"
        className="relative flex max-h-[min(36rem,calc(100dvh-2rem))] w-full max-w-sm flex-col border-[3px] border-ink bg-surface shadow-pixel"
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b-[3px] border-ink bg-ink px-3 py-2">
          <p className="font-display text-[13px] text-canvas">▸ 벼림대</p>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="press font-display text-[11px] text-canvas/70"
          >
            닫기
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {/* 대상 */}
          <div
            className={`flex items-center gap-3 border-2 border-ink px-3 py-2.5 ${
              phase === 'done' && result?.kind === 'success'
                ? 'animate-enhance-flash'
                : 'bg-surface'
            } ${phase === 'tense' ? 'animate-enhance-shake' : ''} ${
              phase === 'done' && result?.kind === 'keep'
                ? 'animate-enhance-shake-fail border-danger'
                : ''
            } ${destroyed ? 'animate-enhance-break border-danger' : ''}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center font-display text-sm ${
                (RANK[def.rank] ?? RANK.F).badge
              }`}
            >
              {def.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[13px] break-keep text-ink">
                {def.name}
                <span
                  className={`ml-1 ${
                    phase === 'done' && result?.kind === 'success'
                      ? 'animate-enhance-pop inline-block text-primary'
                      : owned.enhance >= 7
                        ? 'text-primary'
                        : 'text-ink-muted'
                  }`}
                >
                  +{owned.enhance}
                </span>
              </p>
              {def.effect && (
                <Chip className="mt-1 border-ink bg-tint-mint text-exp">
                  {effectPercent(def, owned.enhance).toFixed(0)}%
                  {!maxed && (
                    <> → {effectPercent(def, next).toFixed(0)}%</>
                  )}
                </Chip>
              )}
            </div>
          </div>

          {maxed ? (
            <p className="border-2 border-ink bg-tint-yellow px-3 py-2.5 text-center font-display text-[12px] text-ink">
              더 벼릴 수 없습니다
            </p>
          ) : phase === 'done' ? (
            <ResultBlock result={result} />
          ) : (
            <>
              {/* 확률 */}
              <div className="border-2 border-ink bg-sunken px-3 py-2.5 font-display text-[11px]">
                <p className="mb-2 text-ink-muted">
                  +{owned.enhance} → +{next}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 tabular-nums">
                  <span className="text-exp">
                    성공 {Math.round(success * 100)}%
                  </span>
                  <span className="text-ink-muted">
                    유지 {Math.round((rest - destroyRate) * 100)}%
                  </span>
                  <span className={destroyRate > 0 ? 'text-danger' : 'text-ink-disabled'}>
                    파괴 {Math.round(destroyRate * 100)}%
                  </span>
                </div>
                {owned.fails > 0 && (
                  <p className="mt-2 border-t-2 border-ink-disabled pt-2 text-[10px] text-ink-muted">
                    실패 {owned.fails}회 누적 → 성공률 +{owned.fails * 5}%p
                  </p>
                )}
              </div>

              {/* 보호권 — 위험 구간에서만 의미가 있다 */}
              {risky && (
                <div className="flex flex-col gap-1.5">
                  <p className="font-display text-[11px] text-ink-muted">
                    파괴 방지 부적
                  </p>
                  <div className="flex flex-col gap-1.5 sm:flex-row">
                    <ProtectOption
                      active={protect === 'none'}
                      onClick={() => setProtect('none')}
                      label="쓰지 않음"
                    />
                    <ProtectOption
                      active={protect === 'gold'}
                      onClick={() => setProtect('gold')}
                      label={`${protectGold.toLocaleString()} G`}
                    />
                    <ProtectOption
                      active={protect === 'shards'}
                      onClick={() => setProtect('shards')}
                      label={`파편 ${PROTECT_SHARDS}개`}
                      disabled={shards < PROTECT_SHARDS}
                    />
                  </div>
                </div>
              )}

              {/* 비용 */}
              <div className="border-2 border-ink bg-sunken px-3 py-2.5 font-display text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-ink-muted">벼림 비용</span>
                  <span className="tabular-nums text-gold-ink">
                    -{total.toLocaleString()} G
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-ink-muted">여비</span>
                  <span
                    className={`tabular-nums ${affordable ? 'text-ink' : 'text-danger'}`}
                  >
                    {gold.toLocaleString()} G
                  </span>
                </div>
              </div>

              {notice && (
                <p className="border-2 border-danger bg-surface px-3 py-2 font-display text-[11px] text-danger">
                  ! {notice}
                </p>
              )}

              {/* 위험 구간에서는 한 번 더 묻는다. 알고 누른 것과 당한 것은 다르다 */}
              {confirming ? (
                <div className="flex flex-col gap-2 border-2 border-danger bg-surface p-3">
                  <p className="animate-blink text-center font-display text-[12px] text-danger">
                    ⚠ 위험 구간 ⚠
                  </p>
                  <p className="text-center text-[11px] leading-relaxed break-keep text-ink-muted">
                    {Math.round(destroyRate * 100)}% 확률로 {def.name}이(가)
                    사라집니다.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row-reverse">
                    <PixelButton onClick={run} className="flex-1 py-2.5 text-xs">
                      벼린다
                    </PixelButton>
                    <PixelButton
                      variant="ghost"
                      onClick={() => setConfirming(false)}
                      className="flex-1 py-2.5 text-xs"
                    >
                      그만둔다
                    </PixelButton>
                  </div>
                </div>
              ) : (
                <PixelButton
                  onClick={() => (destroyRate > 0 ? setConfirming(true) : run())}
                  disabled={!affordable || busy}
                  className="w-full py-3 text-sm"
                >
                  {busy ? (
                    <span className="animate-blink">벼리는 중...</span>
                  ) : (
                    '벼리기'
                  )}
                </PixelButton>
              )}
            </>
          )}

          {phase === 'done' && (
            <PixelButton
              variant="ghost"
              onClick={destroyed ? onClose : () => setPhase('idle')}
              className="w-full py-2.5 text-xs"
            >
              {/* 손실 직후의 충동을 앱이 부추기면 안 된다 */}
              {destroyed ? '돌아가기' : '계속'}
            </PixelButton>
          )}
        </div>
      </div>
    </div>
  );
}

function ProtectOption({
  active,
  label,
  disabled,
  onClick,
}: {
  active: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`press flex-1 border-2 px-2 py-1.5 font-display text-[11px] ${
        active
          ? 'border-primary bg-tint-lavender text-primary'
          : disabled
            ? 'cursor-not-allowed border-ink-disabled bg-sunken text-ink-disabled'
            : 'border-ink bg-surface text-ink-muted'
      }`}
    >
      {label}
    </button>
  );
}

function ResultBlock({ result }: { result: EnhanceResult | null }) {
  if (!result) return null;

  if (result.kind === 'success') {
    return (
      <div className="relative border-2 border-primary bg-tint-lavender px-3 py-4 text-center">
        {/* 파편은 사방으로 튄다 */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI) / 4;
          return (
            <span
              key={i}
              aria-hidden
              className="animate-spark pointer-events-none absolute top-1/2 left-1/2 h-1.5 w-1.5 bg-primary"
              style={
                {
                  '--dx': `${Math.round(Math.cos(angle) * 24)}px`,
                  '--dy': `${Math.round(Math.sin(angle) * 24)}px`,
                } as React.CSSProperties
              }
            />
          );
        })}
        <p className="font-display text-sm text-primary">
          ★ 벼림 성공 — +{result.level} ★
        </p>
      </div>
    );
  }

  if (result.kind === 'keep') {
    return (
      <div className="border-2 border-danger bg-surface px-3 py-4 text-center">
        <p className="font-display text-[13px] text-danger">벼림 실패</p>
        <p className="mt-1.5 text-[11px] break-keep text-ink-muted">
          장비는 그대로입니다. 다음 성공률 {Math.round(result.nextRate * 100)}%
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden border-2 border-danger bg-tint-gray px-3 py-4 text-center">
      {/* 파괴의 파편은 중력 방향으로만 떨어진다 */}
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="animate-debris pointer-events-none absolute top-1/3 left-1/2 h-1.5 w-1.5 bg-danger"
          style={
            {
              '--dx': `${Math.round((i - 6) * 5)}px`,
              '--dy': `${8 + ((i * 7) % 13)}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <p className="font-display text-[13px] text-danger">
        ✕ 파괴 — {result.name} ✕
      </p>
      <p className="mt-1.5 font-display text-[11px] text-ink-muted">
        유물의 파편 {result.shards}개 획득
      </p>
    </div>
  );
}
