import type { Quest } from './quest';

/**
 * 하루 마감.
 *
 * 이 앱에는 시작만 있고 끝이 없었다. 퀘스트를 만들고 완료하지만 하루가 닫히지 않아서,
 * AI가 생성한 `debuff`는 표시만 되고 아무 일도 하지 않는 장식이었다.
 *
 * 브라우저 앱이라 자정에 스스로 깨어날 수 없다. 그래서 **다음에 앱을 열었을 때**
 * 지나간 날을 정산한다.
 */

/** 미완료 1개당 다음 날 EXP -5%, 최대 -20%. 아프면 앱을 안 열게 된다 */
export const DEBUFF_PER_MISS = 5;
export const DEBUFF_MAX = 20;

export interface DaySummary {
  date: string;
  total: number;
  done: number;
  exp: number;
  gold: number;
  missed: Quest[];
  /** 다음 날 적용될 EXP 감소율(%) */
  debuffPercent: number;
}

export function debuffPercentFor(missedCount: number): number {
  return Math.min(missedCount * DEBUFF_PER_MISS, DEBUFF_MAX);
}

export function summarize(date: string, quests: Quest[]): DaySummary {
  const done = quests.filter((q) => q.completed);
  const missed = quests.filter((q) => !q.completed);

  // 그날 실제로 받은 양을 쓴다. 없으면(구버전 기록) 기본값으로 대체
  const exp = done.reduce((sum, q) => sum + (q.earned?.exp ?? q.rewards.exp), 0);
  const gold = done.reduce(
    (sum, q) => sum + (q.earned?.gold ?? q.rewards.gold),
    0,
  );

  return {
    date,
    total: quests.length,
    done: done.length,
    exp,
    gold,
    missed,
    debuffPercent: debuffPercentFor(missed.length),
  };
}

/**
 * 정산해야 할 날짜. 지나갔고, 퀘스트가 있고, 아직 안 닫힌 날 중 **가장 최근** 하루.
 * 일주일을 비웠다고 일곱 번 정산 화면을 보여줄 수는 없다 —
 * 나머지는 조용히 닫는다 (`closeDay` 참조).
 */
export function pendingCloseDate(
  days: Record<string, Quest[]>,
  closedDays: string[],
  today: string,
): string | null {
  const closed = new Set(closedDays);
  const candidates = Object.keys(days)
    .filter((d) => d < today && !closed.has(d) && (days[d]?.length ?? 0) > 0)
    .sort();
  return candidates.at(-1) ?? null;
}

/** 정산 대상 날짜를 포함해, 그보다 오래된 미정산 날짜를 모두 닫는다 */
export function datesToClose(
  days: Record<string, Quest[]>,
  closedDays: string[],
  upTo: string,
): string[] {
  const closed = new Set(closedDays);
  return Object.keys(days).filter((d) => d <= upTo && !closed.has(d));
}

export interface ActiveDebuff {
  date: string;
  percent: number;
}

/** 디버프는 하루만 산다 */
export function activeDebuffPercent(
  debuff: ActiveDebuff | null,
  today: string,
): number {
  if (!debuff || debuff.date !== today) return 0;
  return debuff.percent;
}

// ─────────────────────────────────────────────
// 연속 기록 보상
//
// 레벨·능력치·골드는 결국 시간을 갈아 넣으면 얻는다.
// **연속 기록만은 하루도 빠지지 않아야** 얻는다 — 시간으로 살 수 없는 유일한 조건이다.
// 그래서 최고 등급 보상을 여기에 건다.
// ─────────────────────────────────────────────

export interface StreakReward {
  days: number;
  label: string;
  gold: number;
  /** 나비의 털 */
  scales?: number;
  itemId?: string;
  desc: string;
}

export const STREAK_REWARDS: StreakReward[] = [
  {
    days: 7,
    label: '이레의 표식',
    gold: 500,
    scales: 30,
    desc: '일주일을 이어냈습니다.',
  },
  {
    days: 30,
    label: '한 달의 증표',
    gold: 3000,
    itemId: 'e_proof_of_streak',
    desc: '한 달을 하루도 빠지지 않았습니다.',
  },
  {
    days: 100,
    label: '백일의 화관',
    gold: 10000,
    itemId: 'c_hundred_crown',
    desc: '백 일. 여기까지 온 사람은 많지 않습니다.',
  },
];

/** 받을 수 있는데 아직 안 받은 보상 */
export function claimableRewards(
  bestStreak: number,
  claimed: number[],
): StreakReward[] {
  return STREAK_REWARDS.filter(
    (r) => bestStreak >= r.days && !claimed.includes(r.days),
  );
}

/** 다음 목표. 전부 받았으면 null */
export function nextReward(claimed: number[]): StreakReward | null {
  return STREAK_REWARDS.find((r) => !claimed.includes(r.days)) ?? null;
}
