'use client';

import { useEffect, useRef, useState } from 'react';
import { PixelSprite } from './PixelSprite';
import { NABI, NABI_PALETTE } from '@/lib/sprite';

/**
 * 의뢰서 수령 연출.
 *
 * 로딩만 돌리면 "받았다"는 사건이 없다.
 * **받아적기 → 양피지 펼침 → 완료** 세 박자로 끊는다.
 */
export type ScrollPhase = 'writing' | 'unfurl' | 'success';

function phaseTitle(phase: ScrollPhase): string {
  if (phase === 'writing') return '나비가 의뢰서를 받아적는 중';
  if (phase === 'unfurl') return '의뢰서가 펼쳐집니다';
  return '의뢰 생성 성공';
}

export function QuestScrollOverlay({
  phase,
  questCount,
  onUnfurled,
  onDone,
}: {
  phase: ScrollPhase;
  questCount: number;
  onUnfurled: () => void;
  onDone: () => void;
}) {
  const [showSuccessCopy, setShowSuccessCopy] = useState(false);
  const onUnfurledRef = useRef(onUnfurled);
  const onDoneRef = useRef(onDone);
  onUnfurledRef.current = onUnfurled;
  onDoneRef.current = onDone;

  useEffect(() => {
    setShowSuccessCopy(false);
    if (phase !== 'unfurl') return;

    const id = setTimeout(() => {
      setShowSuccessCopy(true);
      onUnfurledRef.current();
    }, 780);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'success') return;
    setShowSuccessCopy(true);
    const id = setTimeout(() => onDoneRef.current(), 1600);
    return () => clearTimeout(id);
  }, [phase]);

  const title = phaseTitle(phase);
  const sheetOpen = phase === 'unfurl' || phase === 'success';
  const unfurling = phase === 'unfurl' && !showSuccessCopy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/55"
        style={{
          backgroundImage:
            'repeating-conic-gradient(#2E2A24 0% 25%, rgba(46,42,36,0.35) 0% 50%)',
          backgroundSize: '4px 4px',
        }}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={title}
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5"
      >
        {phase === 'writing' && (
          <>
            <div className="animate-float">
              <PixelSprite layers={[NABI]} palette={NABI_PALETTE} size={64} />
            </div>
            <p className="animate-blink font-display text-sm text-surface">
              {title}...
            </p>
          </>
        )}

        {sheetOpen && (
          <div
            className={`quest-scroll-sheet w-full border-[3px] border-ink bg-surface px-5 py-8 shadow-pixel-lg ${
              unfurling ? 'quest-scroll-unfurl' : ''
            }`}
          >
            <div className="mb-4 flex justify-center gap-1" aria-hidden>
              <span className="h-2 w-2 bg-ink" />
              <span className="h-2 w-2 bg-ink" />
              <span className="h-2 w-2 bg-ink" />
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <p className="font-display text-sm leading-relaxed break-keep text-ink sm:text-base">
                나비가 의뢰서를 촤악 펼쳤습니다!
              </p>
              {!unfurling && (
                <p className="font-display text-[11px] text-ink-muted sm:text-xs">
                  오늘의 의뢰서 {questCount}건이 도착했습니다
                </p>
              )}
            </div>

            <div
              className="mx-auto mt-6 h-px w-4/5 bg-ink-disabled"
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  );
}
