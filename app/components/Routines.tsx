'use client';

import { WEEKDAY } from '@/lib/date';
import { CATEGORY, type Quest } from '@/lib/quest';
import { alreadyToday, routinesFor, type Routine } from '@/lib/routine';
import { Chip, Panel, PixelButton } from './Pixel';

/**
 * 상시 의뢰.
 *
 * 루틴 앱인데 정작 루틴을 저장할 수 없었다. 매일 같은 걸 입력하고,
 * 그때마다 AI를 호출했다. 여기 등록해두면 **AI 없이 원클릭**으로 받아온다.
 */
export function Routines({
  routines,
  today,
  todayQuests,
  onSummon,
  onToggleDay,
  onRemove,
}: {
  routines: Routine[];
  today: string;
  todayQuests: Quest[];
  onSummon: () => void;
  onToggleDay: (id: string, day: number) => void;
  onRemove: (id: string) => void;
}) {
  if (routines.length === 0) return null;

  const due = routinesFor(routines, today);
  const pending = due.filter((r) => !alreadyToday(todayQuests, r));

  return (
    <Panel
      title="상시 의뢰"
      right={
        <span className="font-display text-[10px] text-canvas/70">
          {routines.length}건
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {pending.length > 0 ? (
          <PixelButton
            onClick={onSummon}
            className="w-full py-2.5 text-xs"
          >
            오늘 몫 {pending.length}건 받아오기
          </PixelButton>
        ) : (
          <p className="border-2 border-ink bg-tint-mint px-3 py-2 text-center font-display text-[11px] text-exp">
            오늘 몫은 모두 받아왔어요
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {routines.map((routine) => {
            const cat = CATEGORY[routine.quest.category] ?? CATEGORY.STR;
            const isDue = due.some((r) => r.id === routine.id);
            const taken = alreadyToday(todayQuests, routine);

            return (
              <li
                key={routine.id}
                className={`border-2 p-2.5 ${
                  isDue ? 'border-ink bg-surface' : 'border-ink-disabled bg-sunken'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-display text-[12px] break-keep ${
                        isDue ? 'text-ink' : 'text-ink-disabled'
                      }`}
                    >
                      {routine.quest.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Chip className={`border-ink ${cat.tint} ${cat.ink}`}>
                        <span aria-hidden>{cat.icon}</span> {cat.name}
                      </Chip>
                      {taken && (
                        <Chip className="border-ink-disabled bg-sunken text-ink-disabled">
                          받아옴
                        </Chip>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(routine.id)}
                    aria-label="상시 의뢰 해제"
                    className="press shrink-0 border-2 border-ink-disabled bg-surface px-1.5 py-0.5 font-display text-[10px] text-ink-muted"
                  >
                    ✕
                  </button>
                </div>

                {/* 요일. 아무것도 안 고르면 매일이다 */}
                <ul className="mt-2 flex gap-1">
                  {WEEKDAY.map((label, day) => {
                    const on =
                      routine.days.length === 0 || routine.days.includes(day);
                    return (
                      <li key={day} className="flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleDay(routine.id, day)}
                          aria-pressed={on}
                          className={`press w-full border-2 py-1 font-display text-[10px] ${
                            on
                              ? 'border-ink bg-ink text-canvas'
                              : 'border-ink-disabled bg-sunken text-ink-disabled'
                          }`}
                        >
                          {label}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {routine.days.length === 0 && (
                  <p className="mt-1.5 font-display text-[9px] text-ink-disabled">
                    매일 받아옵니다
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
