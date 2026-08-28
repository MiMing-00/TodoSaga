import { daysBetween, lastNDays } from './date';
import type { OwnedItem } from './inventory';
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

// ─────────────────────────────────────────────
// 「쉬어가기 부적」— t_rest_charm
//
// "하루를 놓쳐도 연속 기록이 끊기지 않는다"는 상점 설명이 실제로는
// 아무 코드와도 연결돼 있지 않았다. 여기서 그 판정을 실제로 만든다.
// ─────────────────────────────────────────────

export const REST_CHARM_ID = 't_rest_charm';

/** 그날 하나라도 완수했으면 연속 기록은 애초에 안 끊긴다 — 부적이 지켜줄 대상이 아니다 */
export function fullyMissed(quests: Quest[]): boolean {
  return quests.length > 0 && quests.every((q) => !q.completed);
}

export function hasRestCharm(inventory: OwnedItem[]): boolean {
  return inventory.some((o) => o.itemId === REST_CHARM_ID && o.count > 0);
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

/**
 * 그림자 세기 (0~4).
 *
 * docs/LORE.md "녹이란 무엇인가" — 그림자는 용사가 만드는 게 아니라
 * 방치된 자리에 저절로 스며드는 낡음이다. 그러니 숫자로 쌓아두지 않는다 —
 * "마지막으로 하루를 살아낸 날(lastClearedDate)로부터 며칠이 지났는가"로
 * 그때그때 어림한다. 오늘 하나라도 완수하면 그 즉시 0으로 밀려난다.
 */
export function shadowLevelFor(
  lastClearedDate: string | null,
  today: string,
): number {
  if (!lastClearedDate) return 0; // 아직 첫 장도 안 열렸다 — 방치가 아니라 백지다
  const gap = daysBetween(lastClearedDate, today);
  if (gap <= 0) return 0;
  if (gap === 1) return 1;
  if (gap <= 3) return 2;
  if (gap <= 6) return 3;
  return 4;
}

/** 재를 판단하는 창(일). 하루 이틀 몰아붙였다고 앉지 않는다 */
const ASH_WINDOW_DAYS = 7;
/** 이 정도는 실제로 밀어붙였어야 재를 논할 수 있다 — 며칠 쉬었다고 재가 앉지는 않는다 */
const ASH_MIN_COMPLETED = 10;

/**
 * 재 세기 (0~4).
 *
 * docs/LORE.md "재 — 무리해서 태운 불씨" — 완력·지혜·인망만 몰아붙이며
 * 생명력·여흥(건강과 쉼)을 계속 방치하면 그 자리에 재가 앉는다.
 * 최근 7일 동안 완수한 퀘스트 중 생명력·여흥 비중이 얼마나 작은가로 어림한다.
 *
 * 그림자와 마찬가지로 새 필드를 저장하지 않는다 — 이미 있는 `days` 기록만으로
 * 매번 다시 잰다. 임계값은 첫 시도값이라 손봐야 할 수 있다.
 */
export function ashLevelFor(
  days: Record<string, Quest[]>,
  today: string,
): number {
  let rest = 0;
  let total = 0;
  for (const date of lastNDays(ASH_WINDOW_DAYS, today)) {
    for (const q of days[date] ?? []) {
      if (!q.completed) continue;
      total += 1;
      if (q.category === 'VIT' || q.category === 'LUK') rest += 1;
    }
  }
  if (total < ASH_MIN_COMPLETED) return 0; // 몰아붙일 만큼 하지도 않았다 — 그건 그림자의 몫
  const restRatio = rest / total;
  if (restRatio >= 0.3) return 0;
  if (restRatio >= 0.2) return 1;
  if (restRatio >= 0.12) return 2;
  if (restRatio >= 0.05) return 3;
  return 4;
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
