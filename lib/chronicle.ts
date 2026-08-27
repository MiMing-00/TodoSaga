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

// ─────────────────────────────────────────────
// 책장 — 한 달이 한 권.
//
// docs/LORE.md "권(卷) — 사가의 매듭": 사가는 끝이 없지만 마디는 있어야
// 한다. 지나간 달은 나비가 다시 못 펼치므로(docs/LORE.md "왜 하필
// 매일이어야 하는가") 그 달의 자리는 영원히 그 모습으로 굳는다 —
// 뭔가 적혔으면 책이 되어 꽂히고, 아무것도 안 적혔으면 빈 자리로
// 영원히 남는다. 새 필드를 저장하지 않는다 — `days`만으로 매번 다시 짠다.
// ─────────────────────────────────────────────

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export type BookStatus = 'bound' | 'empty' | 'writing';

export interface BookSlot {
  year: number;
  month: number;
  key: string;
  status: BookStatus;
  /** 묶인 책만 갖는다 — 빈 자리·아직 쓰는 중인 달엔 번호도, 제목도 없다 */
  volume: number | null;
  title: string | null;
  dominant: Category | null;
  totalDone: number;
  /** 'writing'일 때만 — 이번 달이 얼마나 채워졌는지(0~1), 날짜 진행 기준 */
  progress?: number;
}

/** 자질별 제목 후보. 같은 (연,월)이면 항상 같은 걸 고른다 — 볼 때마다 안 바뀌게 */
const BOOK_TITLES: Record<Category, string[]> = {
  STR: ['다시 일어서는 법', '몸을 밀어붙인 나날', '땀으로 적은 장'],
  INT: ['읽고 쌓은 만큼', '조용히 채운 시간', '책장을 넘긴 자리'],
  CHA: ['마주 앉은 사람들', '나눈 말의 무게', '곁을 지킨 기록'],
  VIT: ['잘 자고 잘 먹은 날들', '몸을 돌본 흔적', '숨 고르기'],
  LUK: ['쓸모없어 보였던 것들', '그냥 좋아서 한 일', '여흥 삼아 남긴 것'],
};

function bookTitle(dominant: Category, year: number, month: number): string {
  const pool = BOOK_TITLES[dominant];
  return pool[(year * 12 + month) % pool.length];
}

/**
 * 기록이 시작된 달부터 이번 달까지, 순서대로 한 칸씩.
 * 완료된 달만 '묶인 책'이나 '빈 자리'가 되고, 이번 달은 'writing'이다.
 */
export function listBookMonths(
  days: Record<string, Quest[]>,
  today: string,
): BookSlot[] {
  const withData = Object.keys(days).filter((d) => (days[d]?.length ?? 0) > 0);
  if (withData.length === 0) return [];

  const earliest = withData.reduce((a, b) => (a < b ? a : b));
  const [ey, em] = earliest.split('-').map(Number);
  const [ty, tm] = today.split('-').map(Number);
  const todayDay = Number(today.slice(-2));

  const slots: BookSlot[] = [];
  let volume = 0;
  let y = ey;
  let m = em;

  while (y < ty || (y === ty && m <= tm)) {
    const isCurrent = y === ty && m === tm;
    const view = buildMonth(days, y, m, today);
    const dominant =
      view.totalDone > 0
        ? CATEGORY_ORDER.reduce(
            (best, key) => (view.stats[key] > view.stats[best] ? key : best),
            CATEGORY_ORDER[0],
          )
        : null;

    if (isCurrent) {
      const daysInMonth = new Date(y, m, 0).getDate();
      slots.push({
        year: y,
        month: m,
        key: monthKey(y, m),
        status: 'writing',
        volume: null,
        title: null,
        dominant,
        totalDone: view.totalDone,
        progress: Math.min(1, todayDay / daysInMonth),
      });
    } else if (dominant) {
      volume += 1;
      slots.push({
        year: y,
        month: m,
        key: monthKey(y, m),
        status: 'bound',
        volume,
        title: bookTitle(dominant, y, m),
        dominant,
        totalDone: view.totalDone,
      });
    } else {
      slots.push({
        year: y,
        month: m,
        key: monthKey(y, m),
        status: 'empty',
        volume: null,
        title: null,
        dominant: null,
        totalDone: 0,
      });
    }

    if (m === 12) {
      y += 1;
      m = 1;
    } else {
      m += 1;
    }
  }

  return slots;
}
