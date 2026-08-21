'use client';

import { MATERIALS } from '@/lib/craft';
import {
  BEAM_COLOR,
  GACHA_PITY,
  GACHA_PRICE,
  GACHA_PRICE_10,
  bestOutcome,
  type GachaOutcome,
} from '@/lib/drop';
import { getItem } from '@/lib/items';
import { RANK } from '@/lib/quest';
import { BOX_CLOSED, BOX_OPEN, BOX_PALETTE } from '@/lib/sprite';
import { useEffect, useRef, useState } from 'react';
import { Chip, Panel, PixelButton } from './Pixel';
import { PixelSprite } from './PixelSprite';

/**
 * 「나비의 상자」.
 *
 * 강화는 "성공하느냐"가 재미지만 뽑기는 **결과가 나오기 전 3초**가 재미다.
 * 꽝이 있어도 재료로 남으므로 긴장이 아니라 **기대**를 설계한다.
 *
 * 흔들림 횟수가 등급 힌트다. 7회가 나왔는데 A 미만인 경우는 없다 —
 * **거짓 예고를 하면 다음부터 아무도 연출을 안 본다.**
 */
type Phase = 'idle' | 'insert' | 'tease' | 'open' | 'result';

const SHAKE_CLASS: Record<number, string> = {
  2: 'animate-box-shake-slow',
  3: 'animate-box-shake',
  5: 'animate-box-shake-fast',
  7: 'animate-box-shake-rush',
};

/**
 * 터져 나가는 조각 열두 개.
 *
 * 무작위로 굴리지 않고 표로 박아 둔다 — 뽑을 때마다 파편 모양이 달라지면
 * 연출이 아니라 잡음이 된다. 정12방위에서 대각선만 조금 짧게 잡았다.
 */
const BURST = Array.from({ length: 12 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 12;
  const reach = i % 3 === 0 ? 74 : 56;
  return {
    dx: Math.round(Math.cos(a) * reach),
    dy: Math.round(Math.sin(a) * reach),
    size: i % 3 === 0 ? 8 : 5,
    delay: (i % 4) * 40,
  };
});

/** 결과가 뜬 뒤 무대 양옆에서 깜빡이는 별. 가운데는 비운다 — 내용을 가리면 안 된다 */
const TWINKLE = [
  { x: 8, y: 18, delay: 0 },
  { x: 88, y: 26, delay: 160 },
  { x: 16, y: 68, delay: 320 },
  { x: 82, y: 74, delay: 80 },
  { x: 5, y: 44, delay: 240 },
  { x: 93, y: 52, delay: 400 },
];

export function Gacha({
  gold,
  pity,
  onPull,
}: {
  gold: number;
  pity: number;
  onPull: (count: 1 | 10) => GachaOutcome[] | { error: string };
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [outcomes, setOutcomes] = useState<GachaOutcome[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function start(count: 1 | 10) {
    if (phase !== 'idle' && phase !== 'result') return;

    const result = onPull(count);
    if ('error' in result) {
      setNotice(result.error);
      return;
    }

    setNotice(null);
    setOutcomes(result);
    clearTimers();

    // 연출을 끄고 싶다는 뜻이면 대기 시간도 함께 0으로 만든다.
    // 애니메이션만 끄고 지연이 남으면 그냥 느린 앱이 된다
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setPhase('result');
      return;
    }

    setPhase('insert');
    timers.current = [
      setTimeout(() => setPhase('tease'), 200),
      setTimeout(() => setPhase('open'), 1000),
      setTimeout(() => setPhase('result'), 1250),
    ];
  }

  function skip() {
    clearTimers();
    setPhase('result');
  }

  const best = bestOutcome(outcomes);
  const beam =
    best && best.kind !== 'dud' ? BEAM_COLOR[best.rank] : 'bg-ink-disabled';
  const shake = best ? SHAKE_CLASS[best.shakes] : '';
  const playing = phase === 'insert' || phase === 'tease' || phase === 'open';

  return (
    <Panel
      title="나비의 상자"
      right={
        <span className="font-display text-[10px] tabular-nums text-canvas/70">
          {gold.toLocaleString()} G
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 무대 */}
        <button
          type="button"
          onClick={playing ? skip : undefined}
          disabled={!playing}
          aria-label={playing ? '연출 건너뛰기' : '뽑기 무대'}
          className="relative flex h-44 w-full items-end justify-center overflow-hidden border-2 border-ink bg-sunken"
        >
          {/* 팡파레.
              전에는 빛기둥 하나였는데, 그건 '위에서 내려온다'는 말이라
              **상자를 열었다**는 사건과 맞지 않았다. 사방으로 터뜨린다.
              픽셀 아트라 조각은 사각형이고, 퍼짐도 steps로 끊는다 */}
          {(phase === 'open' || phase === 'result') && best?.kind !== 'dud' && (
            <span
              className="pointer-events-none absolute bottom-20 left-1/2 h-0 w-0"
              aria-hidden
            >
              {BURST.map((b, i) => (
                <span
                  key={i}
                  className={`animate-burst absolute ${beam}`}
                  style={{
                    width: b.size,
                    height: b.size,
                    marginLeft: -b.size / 2,
                    marginTop: -b.size / 2,
                    animationDelay: `${b.delay}ms`,
                    ['--dx' as string]: `${b.dx}px`,
                    ['--dy' as string]: `${b.dy}px`,
                  }}
                />
              ))}
            </span>
          )}

          {/* 결과가 뜬 뒤에도 양옆에서 계속 반짝인다 */}
          {phase === 'result' && best?.kind !== 'dud' && (
            <span className="pointer-events-none absolute inset-0" aria-hidden>
              {TWINKLE.map((t, i) => (
                <span
                  key={i}
                  className="animate-twinkle absolute font-display text-sm text-gold"
                  style={{
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    animationDelay: `${t.delay}ms`,
                  }}
                >
                  ✦
                </span>
              ))}
            </span>
          )}

          {phase === 'idle' ? (
            /* 빈 자리에 글자만 띄워두면 여기가 뭘 하는 곳인지 안 읽힌다.
               열기 전에도 **상자를 보여준다.** 눌러야 할 물건이 눈앞에 있어야 한다 */
            <span className="mb-6 flex flex-col items-center gap-3">
              <span className="animate-float">
                <PixelSprite
                  layers={[BOX_CLOSED]}
                  palette={BOX_PALETTE}
                  size={88}
                />
              </span>
              <span className="font-display text-[11px] text-ink-muted">
                상자를 열어보세요
              </span>
            </span>
          ) : (
            <span
              className={`relative mb-6 ${
                phase === 'insert' ? 'animate-box-rise' : ''
              } ${phase === 'tease' ? shake : ''} ${
                phase === 'tease' && best?.shakes === 7 ? 'scale-110' : ''
              }`}
            >
              <PixelSprite
                layers={[phase === 'insert' || phase === 'tease' ? BOX_CLOSED : BOX_OPEN]}
                palette={BOX_PALETTE}
                size={88}
              />
            </span>
          )}

          {playing && (
            <span className="pointer-events-none absolute right-2 bottom-2 font-display text-[9px] text-ink-disabled">
              탭하면 건너뛰기
            </span>
          )}
        </button>

        {/* 결과 */}
        {phase === 'result' && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {outcomes.map((o, i) => (
              <li key={i}>{renderOutcome(o)}</li>
            ))}
          </ul>
        )}

        {notice && (
          <p className="border-2 border-danger bg-surface px-3 py-2 font-display text-[11px] text-danger">
            ! {notice}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <PixelButton
            onClick={() => start(1)}
            disabled={playing || gold < GACHA_PRICE}
            className="flex-1 py-2.5 text-xs"
          >
            한 번 {GACHA_PRICE.toLocaleString()} G
          </PixelButton>
          <PixelButton
            onClick={() => start(10)}
            disabled={playing || gold < GACHA_PRICE_10}
            className="flex-1 py-2.5 text-xs"
          >
            열 번 {GACHA_PRICE_10.toLocaleString()} G
          </PixelButton>
        </div>

        <div className="border-2 border-ink bg-sunken px-3 py-2.5">
          <div className="mb-1.5 flex items-baseline justify-between gap-2 font-display text-[11px]">
            <span className="text-ink">천장까지</span>
            <span className="tabular-nums text-ink-muted">
              {GACHA_PITY - pity}회
            </span>
          </div>
          <p className="text-[11px] leading-relaxed break-keep text-ink-muted">
            치장만 나옵니다. 꽝이 나와도 재료로 남고, {GACHA_PITY}회 안에는 A
            이상이 반드시 나와요.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function renderOutcome(o: GachaOutcome) {
  if (o.kind === 'dud') {
    return (
      <div className="flex h-full flex-col gap-1 border-2 border-ink-disabled bg-sunken px-2.5 py-2">
        <span className="font-display text-[10px] text-ink-disabled">꽝</span>
        <span className="font-display text-[11px] break-keep text-ink-muted">
          {MATERIALS[o.material].name} +1
        </span>
      </div>
    );
  }

  const rank = RANK[o.rank] ?? RANK.F;
  const art = getItem(o.itemId)?.art;

  return (
    <div
      className={`flex h-full items-start gap-2 border-2 px-2.5 py-2 ${
        o.kind === 'duplicate'
          ? 'border-ink-disabled bg-sunken'
          : 'border-ink bg-surface'
      }`}
    >
      {art && (
        <span
          className="mt-0.5 h-4 w-4 shrink-0 border border-ink"
          style={{ backgroundColor: art.color }}
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <span
          className={`font-display text-[11px] break-keep ${
            o.kind === 'duplicate' ? 'text-ink-muted' : 'text-ink'
          }`}
        >
          {o.name}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Chip className={rank.badge}>{o.rank}</Chip>
          {/* '중복'이라는 말을 쓰지 않는다. 같은 사실이지만
              하나는 손해로, 하나는 획득으로 읽힌다 */}
          {o.kind === 'duplicate' && (
            <Chip className="border-ink bg-tint-lavender text-cha">
              보유 중 → 털 +{o.scales}
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}
