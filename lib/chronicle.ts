import { dateKey } from './date';
import { CATEGORY_ORDER, type Category, type Quest, type Stats } from './quest';

/**
 * 사가의 서 — 날짜별 기록.
 *
 * `days`에 이미 전부 쌓여 있는데 최근 7일 도트로만 보였다.
 * 완료 시 남겨둔 `earned`(그날 실제로 받은 양)까지 있으므로 화면만 붙이면 된다.
 */

export interface DayCell {
  date: string;
  /** 이 달에 속하지 않는 앞뒤 여백 칸 */
  filler: boolean;
  total: number;
  done: number;
  /** 그날 가장 많이 쌓은 자질 */
  dominant: Category | null;
  /** 그날 완수한 의뢰의 자질들. 칸 아래에 아이콘으로 찍는다 */
  categories: Category[];
  future: boolean;
}

export interface MonthView {
  year: number;
  month: number;
  cells: DayCell[];
  totalDone: number;
  totalExp: number;
  totalGold: number;
  /** 이 달 자질별 획득량 */
  stats: Stats;
  /** 하나라도 완수한 날 */
  activeDays: number;
}

const EMPTY: Stats = { STR: 0, INT: 0, CHA: 0, VIT: 0, LUK: 0 };

function dominantOf(quests: Quest[]): Category | null {
  const gained: Stats = { ...EMPTY };
  for (const q of quests) {
    if (q.completed) gained[q.category] += q.earned?.exp ?? q.rewards.exp;
  }
  let best: Category | null = null;
  let bestValue = 0;
  for (const key of CATEGORY_ORDER) {
    if (gained[key] > bestValue) {
      best = key;
      bestValue = gained[key];
    }
  }
  return best;
}

export function buildMonth(
  days: Record<string, Quest[]>,
  year: number,
  month: number,
  today: string,
): MonthView {
  const first = new Date(year, month - 1, 1, 12);
  const daysInMonth = new Date(year, month, 0, 12).getDate();
  const leading = first.getDay();

  const cells: DayCell[] = [];

  for (let i = 0; i < leading; i += 1) {
    cells.push({
      date: `pad-${i}`, filler: true, total: 0, done: 0,
      dominant: null, categories: [], future: false,
    });
  }

  const stats: Stats = { ...EMPTY };
  let totalDone = 0;
  let totalExp = 0;
  let totalGold = 0;
  let activeDays = 0;

  for (let d = 1; d <= daysInMonth; d += 1) {
    const key = dateKey(new Date(year, month - 1, d, 12));
    const quests = days[key] ?? [];
    const done = quests.filter((q) => q.completed);

    for (const q of done) {
      const exp = q.earned?.exp ?? q.rewards.exp;
      stats[q.category] += exp;
      totalExp += exp;
      totalGold += q.earned?.gold ?? q.rewards.gold;
    }
    totalDone += done.length;
    if (done.length > 0) activeDays += 1;

    cells.push({
      date: key,
      filler: false,
      total: quests.length,
      done: done.length,
      dominant: dominantOf(quests),
      // 순서를 고정한다 — 같은 날인데 볼 때마다 아이콘 순서가 바뀌면 안 된다
      categories: CATEGORY_ORDER.filter((c) =>
        done.some((q) => q.category === c),
      ),
      future: key > today,
    });
  }

  return { year, month, cells, totalDone, totalExp, totalGold, stats, activeDays };
}

/** 완료 수에 따른 잔디 농도 (0~3) */
export function density(done: number): 0 | 1 | 2 | 3 {
  if (done === 0) return 0;
  if (done <= 2) return 1;
  if (done <= 4) return 2;
  return 3;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month - 1 + delta, 1, 12);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
