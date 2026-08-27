'use client';

import { useId, type ReactNode } from 'react';

/**
 * 세계관 용어 옆에 붙는 작은 설명.
 *
 * docs/LORE.md에 적힌 뜻을 화면에서도 한 조각씩 만날 수 있게 하는 자리 —
 * 나비가 대신 말해주지 않는, 조용히 옆에 놓인 각주다.
 *
 * 호버(또는 키보드 포커스)하면 뜬다. 클릭이 아니라 호버인 이유:
 * 이건 확인이 필요한 조작이 아니라 궁금하면 잠깐 들여다보는 곁말이라서다.
 */
export function LoreTip({
  children,
  hint,
  /** 아이콘·뱃지처럼 밑줄이 안 어울리는 자리에서는 표시선을 뺀다 */
  plain = false,
}: {
  children: ReactNode;
  hint: string;
  plain?: boolean;
}) {
  const id = useId();

  return (
    <span
      tabIndex={0}
      aria-describedby={id}
      className={`group relative inline-flex cursor-help items-baseline outline-none ${
        plain ? '' : 'border-b border-dotted border-ink-disabled'
      } focus-visible:border-b focus-visible:border-primary`}
    >
      {children}
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-max max-w-[15rem] -translate-x-1/2 border-2 border-ink bg-surface px-2 py-1.5 text-left font-body text-[11px] leading-snug break-keep text-ink opacity-0 shadow-pixel-sm transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {hint}
      </span>
    </span>
  );
}
