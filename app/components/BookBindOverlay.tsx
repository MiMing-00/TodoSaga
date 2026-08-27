'use client';

import { useEffect, useState } from 'react';
import { BookSpine } from './BookSpine';
import { PixelButton } from './Pixel';

const PAGE_COUNT = 6;
const PAGE_MS = 90;

/**
 * 한 권이 엮이는 순간.
 *
 * docs/LORE.md "권(卷) — 사가의 매듭" — 사가는 끝이 없지만 마디는 있다.
 * 지난 달로 넘어간 순간 그 달은 다시 못 고친다(같은 문서 "왜 하필
 * 매일이어야 하는가") — 그러니 이건 축하이자 마감이다.
 *
 * 낡은 양피지 낱장이 챠르륵 넘어가다 탁 닫히면, 방금 엮인 가죽 책이
 * 남는다(BookSpine — 책장과 같은 무늬를 쓴다). DESIGN.md "픽셀에 흐림은
 * 없다" — 넘어가는 건 그러데이션이 아니라 steps() 스냅 전환(book-page)
 * 이다. 금빛 반짝임(twinkle) 한 톨만 "마법 판타지" 쪽으로 살짝 얹는다 —
 * 과하면 그냥 이펙트고, 한두 개면 고서에 깃든 것처럼 읽힌다.
 */
export function BookBindOverlay({
  volume,
  title,
  onDone,
}: {
  volume: number;
  title: string;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<'flip' | 'bound'>('flip');

  useEffect(() => {
    const t = setTimeout(
      () => setPhase('bound'),
      PAGE_COUNT * PAGE_MS + 200,
    );
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70" />

      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex h-[260px] items-end gap-[3px]" aria-hidden>
          {phase === 'flip' ? (
            Array.from({ length: PAGE_COUNT }, (_, i) => (
              <span
                key={i}
                className="animate-book-page h-full w-4 border-2 border-[#8a6d1f] bg-canvas"
                style={{ animationDelay: `${i * PAGE_MS}ms` }}
              />
            ))
          ) : (
            <>
              <BookSpine volume={volume} height={260} />
              {/* 금빛 반짝임 두어 톨 — 고서에 마법이 깃든 느낌 */}
              <span
                className="animate-twinkle absolute -top-2 -left-2 text-[10px]"
                style={{ color: '#c9a227' }}
              >
                ✦
              </span>
              <span
                className="animate-twinkle absolute -right-3 top-3 text-[8px]"
                style={{ color: '#c9a227', animationDelay: '120ms' }}
              >
                ✦
              </span>
            </>
          )}
        </div>

        {phase === 'bound' && (
          <div className="animate-pop-in flex flex-col items-center gap-3 text-center">
            <p className="font-display text-[11px] text-canvas/80">
              한 권이 엮였습니다
            </p>
            <p className="font-display text-lg break-keep text-canvas">
              제{volume}권 「{title}」
            </p>
            <PixelButton
              variant="primary"
              onClick={onDone}
              className="px-4 py-2 text-xs"
            >
              책장에 꽂기
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
}
