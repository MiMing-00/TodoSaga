'use client';

import { DailyClose } from '@/app/components/DailyClose';
import { NabiCompanion } from '@/app/components/NabiCompanion';
import { StatusPlate } from '@/app/components/StatusPlate';
import { PixelSprite } from '@/app/components/PixelSprite';
import { TabNav } from '@/app/components/TabNav';
import { equippedCosmetics } from '@/lib/inventory';
import { activeStreak, useSagaStore } from '@/lib/store';
import {
  ashLevelFor,
  fullyMissed,
  hasRestCharm,
  pendingCloseDate,
  shadowLevelFor,
  summarize,
} from '@/lib/daily';
import { todayKey } from '@/lib/date';
import { EXP_PER_LEVEL, expInLevel, levelFromExp } from '@/lib/quest';
import { NABI, NABI_PALETTE } from '@/lib/sprite';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * 좌우로 갈라 쓰는(레일 · 비대칭 분할) 페이지는 컨테이너를 더 넓게 연다.
 * 설정만 예외로 좁게 둔다 — 짧은 폼 하나뿐이라 넓힐 이유가 없다.
 */
const SPLIT_ROUTES = ['/', '/character', '/bag', '/shop'];

/**
 * 사가 화면 공통 껍데기.
 *
 * HUD·하루 마감·토스트·탭은 어느 페이지에 있든 같아야 하므로 여기에 둔다.
 * 하이드레이션 게이트도 여기서 한 번만 통과시킨다 —
 * 페이지마다 반복하면 탭을 옮길 때마다 로딩이 깜빡인다.
 */
export default function SagaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useSagaStore((s) => s.hydrated);
  const exp = useSagaStore((s) => s.exp);
  const gold = useSagaStore((s) => s.gold);
  const days = useSagaStore((s) => s.days);
  const streak = useSagaStore((s) => s.streak);
  const lastClearedDate = useSagaStore((s) => s.lastClearedDate);
  const charClass = useSagaStore((s) => s.charClass);
  const inventory = useSagaStore((s) => s.inventory);
  const equipped = useSagaStore((s) => s.equipped);
  const closedDays = useSagaStore((s) => s.closedDays);
  const affection = useSagaStore((s) => s.affection);
  const petLog = useSagaStore((s) => s.petLog);
  const nabiFur = useSagaStore((s) => s.nabiFur);
  const nabiAccessory = useSagaStore((s) => s.nabiAccessory);
  const petNabi = useSagaStore((s) => s.petNabi);
  const closeDay = useSagaStore((s) => s.closeDay);
  const toast = useSagaStore((s) => s.toast);
  const dismissToast = useSagaStore((s) => s.dismissToast);

  const pathname = usePathname();
  const isSplit = SPLIT_ROUTES.includes(pathname);

  // 저장된 상태는 마운트 후에 복원한다.
  // 렌더 중에 localStorage를 읽으면 서버 HTML과 값이 달라져 하이드레이션이 깨진다.
  // hydrated가 false로 남는 경우(복원 실패·HMR 리셋)에도 반드시 게이트를 연다.
  useEffect(() => {
    if (hydrated) return;

    let cancelled = false;
    // zustand rehydrate는 storage 없을 때 undefined를 돌려준다
    void Promise.resolve(useSagaStore.persist.rehydrate()).finally(() => {
      if (!cancelled) useSagaStore.getState().markHydrated();
    });

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 2600);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5">
        <div className="animate-float">
          <PixelSprite
            layers={[NABI]}
            palette={NABI_PALETTE}
            size={72}
          />
        </div>
        <p className="animate-blink font-display text-sm text-ink-muted">
          사가의 서를 펼치는 중...
        </p>
      </div>
    );
  }

  const today = todayKey();
  // 자정에 스스로 깨어날 수 없으니, 다음에 열었을 때 지나간 날을 정산한다
  const closeTarget = pendingCloseDate(days, closedDays, today);
  // 그림자·재는 숫자로만 있지 않다 — 나비가 다니는 배경에도 얼룩으로 스민다
  const shadowLevel = shadowLevelFor(lastClearedDate, today);
  const ashLevel = ashLevelFor(days, today);

  const status = (variant: 'side' | 'strip') => (
    <StatusPlate
      variant={variant}
      level={levelFromExp(exp)}
      expInCurrent={expInLevel(exp)}
      expToNext={EXP_PER_LEVEL}
      gold={gold}
      streak={activeStreak(streak, lastClearedDate)}
      charClass={charClass}
      cosmetics={equippedCosmetics(inventory, equipped)}
    />
  );

  return (
    /**
     * 앱 셸.
     *
     * **헤더가 없다.** 상태 판은 길찾기(사이드바 / 하단 탭)에 붙어 있고,
     * 화면 위쪽은 내용에게 온전히 내준다.
     *
     * 문서 전체를 스크롤시키면 모바일에서 주소창이 뜨고 내릴 때마다
     * 하단 탭이 흔들린다. 화면 높이를 고정하고 **가운데만** 스크롤한다.
     */
    <div className="flex h-dvh overflow-hidden">
      <TabNav variant="side" status={status('side')} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto overscroll-contain">
          {/* z-30. 나비(z-20)가 이 뒤로 지나가고, 가려진 동안엔 눌리지 않는다 */}
          <div
            className={`relative z-30 mx-auto flex flex-col gap-6 px-4 pt-7 pb-10 sm:gap-7 sm:px-8 sm:pt-9 ${
              isSplit ? 'max-w-3xl xl:max-w-6xl' : 'max-w-3xl xl:max-w-4xl'
            }`}
          >
            {children}
          </div>
        </main>

        <TabNav variant="bottom" status={status('strip')} />
      </div>

      {/* 넓은 화면에만. 좁은 화면에는 여백이 없어 내용을 가린다 */}
      <NabiCompanion
        affection={affection}
        petsToday={petLog.date === today ? petLog.count : 0}
        furId={nabiFur}
        accessoryId={nabiAccessory}
        onPet={() => petNabi(today)}
        shadowLevel={shadowLevel}
        ashLevel={ashLevel}
      />

      {closeTarget && (
        <DailyClose
          summary={summarize(closeTarget, days[closeTarget] ?? [])}
          restCharmWillApply={
            fullyMissed(days[closeTarget] ?? []) && hasRestCharm(inventory)
          }
          onClose={() => closeDay(closeTarget, today)}
        />
      )}

      {toast && (
        <div
          /* 좁은 화면: 하단 크롬(상태 스트립 + 탭) 위로 띄운다.
             넓은 화면: 우상단 — 내용과 나비를 가리지 않는 자리다 */
          className="pointer-events-none fixed inset-x-0 bottom-32 z-50 flex justify-center px-4 sm:inset-x-auto sm:top-5 sm:right-6 sm:bottom-auto sm:justify-end"
          role="status"
        >
          <div className="max-w-[86vw] border-2 border-ink bg-primary px-2.5 py-1.5 text-center font-display text-[11px] break-keep text-white shadow-pixel-sm sm:max-w-xs sm:border-[3px] sm:px-3.5 sm:py-2 sm:text-xs sm:shadow-pixel">
            <span className="animate-blink" aria-hidden>
              ★
            </span>{' '}
            {toast.text}{' '}
            <span className="animate-blink" aria-hidden>
              ★
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
