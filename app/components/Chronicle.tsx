'use client';

import { buildMonth, density, listBookMonths, monthKey, shiftMonth } from '@/lib/chronicle';
import { formatKorean, todayKey, WEEKDAY } from '@/lib/date';
import { CATEGORY, CATEGORY_ORDER, type Quest } from '@/lib/quest';
import { useEffect, useState } from 'react';
import { BookBindOverlay } from './BookBindOverlay';
import { Bookshelf } from './Bookshelf';
import { Chip, Panel, PixelButton } from './Pixel';

/**
 * 사가의 서.
 *
 * 한때 잔디를 **그날 가장 많이 쌓은 자질의 색**으로 칠했다.
 * 뜻은 좋았지만 한 달 격자에 다섯 색이 흩뿌려지니 무늬로만 보이고
 * 정작 "며칠을 걸었나"가 안 읽혔다. 색이 많으면 아무것도 강조되지 않는다.
 *
 * 그래서 **잔디는 한 색의 농도로만** 그린다 — 많이 한 날일수록 짙다.
 * 자질의 치우침은 아래 막대가 이미 말해 주므로 두 번 말할 필요가 없다.
 */
/** 잔디 한 칸의 농도. 한 색만 쓰고 짙기로만 말한다 */
const DENSITY: Record<number, string> = {
  1: 'bg-tint-lavender text-ink',
  2: 'bg-primary/60 text-white',
  3: 'bg-primary text-white',
};

export function Chronicle({
  days,
  lastSeenBookMonth,
  onSeenBook,
}: {
  days: Record<string, Quest[]>;
  /** 책장을 마지막으로 확인한 달(YYYY-MM). null이면 이 기능을 처음 켜는 것 */
  lastSeenBookMonth: string | null;
  onSeenBook: (monthKey: string) => void;
}) {
  const today = todayKey();
  const now = new Date();
  const [{ year, month }, setMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [picked, setPicked] = useState<string | null>(null);

  const view = buildMonth(days, year, month, today);
  const pickedQuests = picked ? (days[picked] ?? []) : [];

  const topStat = CATEGORY_ORDER.reduce(
    (best, key) => (view.stats[key] > view.stats[best] ? key : best),
    CATEGORY_ORDER[0],
  );
  const hasRecord = view.totalDone > 0;

  // 책장 — docs/LORE.md "권(卷) — 사가의 매듭"
  const slots = listBookMonths(days, today);
  const writingSlot = slots.find((s) => s.status === 'writing');
  const currentKey = writingSlot ? writingSlot.key : (slots.at(-1)?.key ?? monthKey(year, month));
  // 지금 펼쳐 보고 있는 달이 이미 묶인 책이면, 그 제목도 같이 보여준다
  const viewedSlot = slots.find((s) => s.year === year && s.month === month);

  const [boundOverlay, setBoundOverlay] = useState<{
    volume: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (slots.length === 0) return;

    // 처음 켜는 것 — 지나간 달을 소급해서 축하하지 않는다. 조용히 오늘로 맞춘다
    if (lastSeenBookMonth === null) {
      onSeenBook(currentKey);
      return;
    }
    if (lastSeenBookMonth >= currentKey) return;

    // 며칠을 비웠어도 정산 화면을 여러 번 띄우지 않는다 — 가장 최근 한 권만 축하한다
    const newlyBound = [...slots]
      .reverse()
      .find((s) => s.status === 'bound' && s.key > lastSeenBookMonth);

    if (newlyBound) {
      setBoundOverlay({
        volume: newlyBound.volume!,
        title: newlyBound.title!,
      });
    } else {
      onSeenBook(currentKey);
    }
    // 마운트 시 한 번만 — 이후 완수로 days가 바뀔 때마다 다시 확인할 필요는 없다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {boundOverlay && (
        <BookBindOverlay
          volume={boundOverlay.volume}
          title={boundOverlay.title}
          onDone={() => {
            onSeenBook(currentKey);
            setBoundOverlay(null);
          }}
        />
      )}

      <Panel
        title="사가의 서"
        right={
          <span className="font-display text-[10px] text-canvas/70">
            {year}년 {month}월
          </span>
        }
      >
        <div className="flex flex-col gap-4">
          {/* 책장 — 캘린더와 한 몸이다. 지나간 달을 책으로 세워 두고,
              그 책등을 눌러 아래 달력을 그 달로 넘긴다 */}
          <Bookshelf
            slots={slots}
            onPick={(y, m) => {
              setMonth({ year: y, month: m });
              setPicked(null);
            }}
          />

          <div className="border-t-2 border-dashed border-ink-disabled" />

          {/* 달 이동 */}
          <div className="flex items-center justify-between gap-2">
            <PixelButton
              variant="ghost"
              onClick={() => {
                setMonth(shiftMonth(year, month, -1));
                setPicked(null);
              }}
              className="px-3 py-1.5 text-[11px] shadow-pixel-sm"
            >
              ◀ 이전 장
            </PixelButton>

            <span className="font-display text-sm text-ink">
              {year}년 {month}월
            </span>

            <PixelButton
              variant="ghost"
              onClick={() => {
                setMonth(shiftMonth(year, month, 1));
                setPicked(null);
              }}
              className="px-3 py-1.5 text-[11px] shadow-pixel-sm"
            >
              다음 장 ▶
            </PixelButton>
          </div>

          {/* 잔디 */}
          <div>
            <ul className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAY.map((w) => (
                <li
                  key={w}
                  className="text-center font-display text-[9px] text-ink-disabled"
                >
                  {w}
                </li>
              ))}
            </ul>

            <ul className="grid grid-cols-7 gap-1">
              {view.cells.map((cell) => {
                if (cell.filler) {
                  return <li key={cell.date} className="aspect-square" />;
                }

                const level = density(cell.done);
                const isToday = cell.date === today;
                const isPicked = cell.date === picked;
                const day = Number(cell.date.slice(-2));

                return (
                  <li key={cell.date}>
                    <button
                      type="button"
                      disabled={cell.total === 0}
                      onClick={() => setPicked(isPicked ? null : cell.date)}
                      aria-label={`${day}일 ${cell.done}/${cell.total} 완수${
                        cell.categories.length > 0
                          ? ` · ${cell.categories.map((c) => CATEGORY[c].name).join(', ')}`
                          : ''
                      }`}
                      className={`press flex aspect-square w-full flex-col justify-between border-2 p-1 text-left font-display text-[10px] ${
                        isPicked || isToday ? 'border-ink' : 'border-ink-disabled'
                      } ${
                        level === 0
                          ? cell.future
                            ? 'bg-transparent text-ink-disabled'
                            : 'bg-sunken text-ink-disabled'
                          : DENSITY[level]
                      }`}
                    >
                      {/* 날짜는 좌상단에 붙여 둔다 — 칸 가운데를 비워야
                          아래에 '무엇을 했는지'를 적을 자리가 생긴다 */}
                      <span className="leading-none tabular-nums opacity-70">
                        {day}
                      </span>

                      {/* 아래 줄이 그날의 요약이다. 숫자보다 아이콘이 빨리 읽힌다 */}
                      <span className="flex flex-wrap items-end gap-0.5 leading-none">
                        {cell.categories.map((c) => (
                          <span
                            key={c}
                            aria-hidden
                            className={`text-[11px] leading-none ${
                              level >= 2 ? 'text-white' : 'text-ink'
                            }`}
                            title={CATEGORY[c].name}
                          >
                            {CATEGORY[c].icon}
                          </span>
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 이달의 요약 */}
          {hasRecord ? (
            <div className="border-2 border-ink bg-sunken px-3 py-2.5">
              <p className="mb-2 font-display text-[11px] text-ink-muted">
                {viewedSlot?.status === 'bound'
                  ? `제${viewedSlot.volume}권 「${viewedSlot.title}」`
                  : '이 장의 기록'}
              </p>
              <div className="flex flex-wrap gap-2 font-display text-[12px]">
                <span className="text-ink tabular-nums">
                  {view.activeDays}일 걸음
                </span>
                <span className="text-ink tabular-nums">
                  의뢰 {view.totalDone}건
                </span>
                <span className="text-ink tabular-nums">
                  +{view.totalExp.toLocaleString()} EXP
                </span>
                <span className="text-ink tabular-nums">
                  +{view.totalGold.toLocaleString()} G
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed break-keep text-ink-muted">
                이 달의 발길은{' '}
                <span className="text-ink">「{CATEGORY[topStat].name}」</span>
                에 가장 오래 머물렀습니다.
              </p>
            </div>
          ) : (
            <p className="border-2 border-dashed border-ink-disabled px-4 py-8 text-center text-xs break-keep text-ink-muted">
              이 장에는 아직 아무것도 적히지 않았어요.
            </p>
          )}

          {/* 자질별 분포 */}
          {hasRecord && (
            <ul className="flex flex-col gap-1.5">
              {CATEGORY_ORDER.map((key) => {
                const cat = CATEGORY[key];
                const value = view.stats[key];
                const max = Math.max(1, ...CATEGORY_ORDER.map((c) => view.stats[c]));
                return (
                  <li key={key} className="flex items-center gap-2.5">
                    <span
                      className={`w-[76px] shrink-0 font-display text-[11px] ${
                        value > 0 ? 'text-ink' : 'text-ink-disabled'
                      }`}
                    >
                      <span aria-hidden>{cat.icon}</span> {cat.name}
                    </span>
                    <div className="flex h-3 flex-1 border-2 border-ink bg-sunken p-[2px]">
                      <div
                        className="h-full bg-ink"
                        style={{ width: `${Math.round((value / max) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right font-display text-[11px] tabular-nums text-ink-muted">
                      {value}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      {/* 하루 펼쳐보기 */}
      {picked && (
        <Panel title={formatKorean(picked)}>
          <ul className="flex flex-col gap-2">
            {pickedQuests.map((quest, i) => {
              const cat = CATEGORY[quest.category] ?? CATEGORY.STR;
              return (
                <li
                  key={`${quest.title}-${i}`}
                  className={`border-2 p-2.5 ${
                    quest.completed
                      ? 'border-ink bg-surface'
                      : 'border-ink-disabled bg-sunken'
                  }`}
                >
                  <p
                    className={`font-display text-[13px] break-keep ${
                      quest.completed ? 'text-ink' : 'text-ink-disabled line-through'
                    }`}
                  >
                    {quest.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <Chip
                      className={
                        quest.completed
                          ? 'border-ink bg-sunken text-ink'
                          : 'border-ink-disabled bg-sunken text-ink-disabled'
                      }
                    >
                      <span aria-hidden>{cat.icon}</span> {cat.name}
                    </Chip>
                    {quest.completed && quest.earned && (
                      <>
                        <Chip className="border-ink bg-surface text-ink-muted">
                          +{quest.earned.exp} EXP
                        </Chip>
                        <Chip className="border-ink bg-surface text-ink-muted">
                          +{quest.earned.gold} G
                        </Chip>
                      </>
                    )}
                    {!quest.completed && (
                      <Chip className="border-ink-disabled bg-sunken text-ink-disabled">
                        놓친 의뢰
                      </Chip>
                    )}
                  </div>

                  {/* 그날 남긴 한 줄. 숫자보다 이쪽이 훨씬 오래 남는다 */}
                  {quest.note && (
                    <p className="mt-2 border-l-[3px] border-ink pl-2.5 text-[12px] leading-relaxed break-keep text-ink-muted">
                      “{quest.note}”
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
