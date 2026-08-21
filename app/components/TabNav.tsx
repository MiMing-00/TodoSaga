'use client';

import { Wordmark } from '@/app/components/Wordmark';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 길찾기.
 *
 * 좁은 화면에서는 **하단 탭** — 엄지로 닿고, 레트로 게임의 하단 HUD와도 맞는다.
 * 넓은 화면에서는 **왼쪽 사이드바** — 가로 여백이 남는데 탭을 아래에 깔면
 * 화면 끝까지 눈이 갔다 와야 한다.
 *
 * 둘 다 `fixed`가 아니라 **셸의 한 행/열**이다. 문서 전체가 스크롤되면
 * 모바일 주소창이 뜨고 내릴 때 탭이 따라 흔들린다.
 *
 * 길찾기는 **조용해야 한다.** 여기서 눈길을 끌면 내용이 진다.
 * 그래서 사이드바 머리에는 로고 하나만 두고(캐릭터도 표어도 빼고),
 * 지금 있는 곳은 채워진 판 하나로만 알린다. 표식을 여럿 달면 금방 어수선해진다.
 */
const TABS = [
  { href: '/', label: '퀘스트', glyph: '▤' },
  { href: '/character', label: '캐릭터', glyph: '☗' },
  { href: '/bag', label: '소지품', glyph: '▣' },
  { href: '/shop', label: '상점', glyph: '⌂' },
  { href: '/chronicle', label: '기록', glyph: '❑' },
];

/** 자주 쓰지 않는다. 본 항목과 섞지 않고 아래에 따로 둔다 */
const SETTINGS = { href: '/settings', label: '설정', glyph: '⚙' };

function sideLink(
  tab: { href: string; label: string; glyph: string },
  active: boolean,
) {
  return (
    <Link
      key={tab.href}
      href={tab.href}
      aria-current={active ? 'page' : undefined}
      className={`press flex items-center gap-2.5 border-2 px-3 py-2.5 font-display text-xs transition-[background-color,color,border-color] duration-100 ${
        active
          ? 'border-ink bg-ink text-canvas'
          : 'border-transparent text-ink-muted hover:border-ink-disabled hover:bg-surface hover:text-ink'
      }`}
    >
      <span aria-hidden className="w-4 text-center text-base leading-none">
        {tab.glyph}
      </span>
      {tab.label}
    </Link>
  );
}

export function TabNav({
  variant,
  status,
}: {
  variant: 'bottom' | 'side';
  /** 상태 판. 헤더로 매달지 않고 길찾기에 붙인다 */
  status?: ReactNode;
}) {
  const pathname = usePathname();

  if (variant === 'side') {
    return (
      <nav className="relative z-30 hidden w-48 shrink-0 flex-col border-r-[3px] border-ink bg-canvas sm:flex">
        {/* 로고만. 높이는 HUD와 같게(78px) 맞추고 밑줄은 긋지 않는다 —
            사이드바가 하나의 기둥으로 읽혀야 한다 */}
        <div className="flex h-[78px] items-center px-4">
          <Wordmark size="sm" />
        </div>

        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5">
          {TABS.map((tab) => (
            <li key={tab.href}>{sideLink(tab, pathname === tab.href)}</li>
          ))}
        </ul>

        <div className="p-2.5 pt-0">
          {sideLink(SETTINGS, pathname === SETTINGS.href)}
        </div>

        {status && <div className="p-2.5 pt-0">{status}</div>}
      </nav>
    );
  }

  const bottom = [...TABS, SETTINGS];

  return (
    <div
      className="relative z-30 shrink-0 border-t-[3px] border-ink bg-canvas sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {status}

      <nav>
        <ul className="flex">
          {bottom.map((tab) => {
            const active = pathname === tab.href;
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2.5 font-display text-[10px] ${
                    active ? 'bg-ink text-canvas' : 'bg-canvas text-ink-muted'
                  }`}
                >
                  <span aria-hidden className="text-base leading-none">
                    {tab.glyph}
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
