'use client';

import { useState, type ReactNode } from 'react';
import { HelpBody, HelpButton } from './HelpToggle';

/**
 * 창(window) 형태의 패널. 상단에 잉크색 타이틀바가 붙는다.
 * 레트로 콘솔 UI의 faceplate 문법 — 카드마다 '무엇을 위한 창인지' 라벨을 붙인다.
 */
export function Panel({
  title,
  right,
  help,
  children,
  className = '',
  style,
  headerStyle,
  grimeStyle,
  collapsible = true,
  defaultOpen = true,
}: {
  title: string;
  right?: ReactNode;
  /** 타이틀바 우측 끝의 '?'. 주면 눌러서 펼칠 수 있는 설명이 생긴다 */
  help?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 몸통(테두리·배경) 인라인 오버라이드 — 그림자·재처럼 색 자체가 흐려져야 할 때 */
  style?: React.CSSProperties;
  /** 타이틀바 인라인 오버라이드. 항상 어두운 색이어야 흰 글자가 읽힌다 */
  headerStyle?: React.CSSProperties;
  /** 타이틀바 바로 밑의 얇은 그을음/먼지 띠. decayTint.ts의 decayGrimeStripStyle 참고 */
  grimeStyle?: React.CSSProperties;
  /** 접을 수 없는 창도 있다 (예: 확인 패널) */
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [helpOpen, setHelpOpen] = useState(false);
  const shown = collapsible ? open : true;

  const heading = (
    <>
      <span className="flex items-center gap-1.5 font-display text-[13px] text-canvas sm:text-sm">
        {collapsible && (
          <span
            aria-hidden
            className={`inline-block transition-transform duration-200 ${
              shown ? 'rotate-90' : ''
            }`}
          >
            ▸
          </span>
        )}
        {!collapsible && <span aria-hidden>▸</span>}
        {title}
      </span>
      {right}
    </>
  );

  // '?'는 접기 버튼과 형제 요소여야 한다 — 버튼 안에 버튼을 넣으면 잘못된 마크업이다
  return (
    <section
      className={`border-[3px] border-ink bg-surface shadow-pixel ${className}`}
      style={style}
    >
      {collapsible ? (
        <h2
          className="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-ink py-2 pr-2 pl-3"
          style={headerStyle}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={shown}
            className="flex flex-1 items-center justify-between gap-2 text-left"
          >
            {heading}
          </button>
          {help && (
            <HelpButton
              open={helpOpen}
              onToggle={() => setHelpOpen((v) => !v)}
              dark
            />
          )}
        </h2>
      ) : (
        <header
          className="flex items-center justify-between gap-2 border-b-[3px] border-ink bg-ink py-2 pr-2 pl-3"
          style={headerStyle}
        >
          {heading}
          {help && (
            <HelpButton
              open={helpOpen}
              onToggle={() => setHelpOpen((v) => !v)}
              dark
            />
          )}
        </header>
      )}

      {grimeStyle && <div aria-hidden className="h-1.5" style={grimeStyle} />}
      {help && <HelpBody open={helpOpen}>{help}</HelpBody>}

      {/*
        접기 애니메이션.
        스프라이트 모션은 steps()로 끊지만, **레이아웃이 여닫히는 움직임만은**
        부드럽게 둔다. 여기서 칸칸이 끊기면 덜컹거리는 것으로만 보인다.
      */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          shown ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * 눌림 물리가 있는 버튼. active 시 2px 밀리면서 그림자가 줄어든다.
 */
export function PixelButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'success' | 'reward';
}) {
  const variants = {
    primary: 'bg-primary text-white border-ink',
    ghost: 'bg-surface text-ink border-ink',
    success: 'bg-exp text-white border-ink',
    // 받아가는 버튼은 눈에 띄어야 한다. 금빛으로 두고 별을 깜빡인다
    reward: 'bg-gold text-white border-ink',
  };
  return (
    <button
      {...props}
      className={`press font-display border-[3px] shadow-pixel disabled:cursor-not-allowed disabled:border-ink-disabled disabled:bg-sunken disabled:text-ink-disabled disabled:shadow-none ${variants[variant]} ${className}`}
    >
      {variant === 'reward' ? (
        <span className="inline-flex items-center gap-1">
          <span className="animate-blink" aria-hidden>
            ★
          </span>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * 데이터 칩. radius 0, 2px 보더.
 */
export function Chip({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 border-2 px-1.5 py-0.5 font-display text-[11px] leading-none sm:text-xs ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * 칸으로 끊기는 게이지. 연속 애니메이션을 쓰지 않는다 —
 * 눈금으로 읽혀야 진행도가 '남은 칸 수'로 인지된다.
 */
export function SegmentGauge({
  value,
  max,
  segments = 10,
  fill = 'bg-exp',
  className = '',
}: {
  value: number;
  max: number;
  segments?: number;
  fill?: string;
  className?: string;
}) {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const filled = Math.round(ratio * segments);
  return (
    <div
      className={`flex gap-[2px] border-2 border-ink bg-sunken p-[2px] ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`h-2.5 flex-1 sm:h-3 ${i < filled ? fill : 'bg-transparent'}`}
        />
      ))}
    </div>
  );
}
