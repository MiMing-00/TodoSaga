'use client';

import type { ReactNode } from 'react';

/**
 * 헤더 한쪽에 붙는 '?'. 누르면 설명이 펼쳐진다.
 *
 * 지금까지 쓰던 LoreTip은 호버로 뜬다 — 마우스가 없는 화면(모바일)에서는
 * 발견할 방법이 없다. '?'는 탭 한 번으로 여는 버튼이고, 펼쳐지는 방식은
 * Panel이 이미 쓰는 접기/펼치기와 같은 시각 언어(steps 전환)를 그대로 쓴다.
 *
 * 버튼과 본문을 하나로 묶지 않는다 — 버튼은 헤더 줄에, 본문은 그 아래
 * 전체 너비로 놓여야 해서 자리가 다르다. 호출부가 같은 `open` 상태를
 * 공유해 둘을 원하는 곳에 각각 놓는다.
 */
export function HelpButton({
  open,
  onToggle,
  dark = false,
}: {
  open: boolean;
  onToggle: () => void;
  /** 어두운 타이틀바 위에 놓일 때는 밝은 글자를 쓴다 */
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? '설명 닫기' : '설명 보기'}
      className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 font-display text-[10px] leading-none ${
        dark
          ? 'border-canvas text-canvas'
          : 'border-ink text-ink-muted'
      }`}
    >
      ?
    </button>
  );
}

export function HelpBody({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className="border-b-2 border-ink bg-tint-yellow px-3 py-2 text-xs leading-relaxed break-keep text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}
