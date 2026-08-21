import type { Quest } from './quest';

/**
 * 상시 의뢰.
 *
 * 루틴 앱인데 정작 **루틴을 저장할 수 없었다.** 매일 같은 걸 입력하고,
 * 그때마다 AI를 호출했다.
 *
 * 한 번 등록해두면 해당 요일에 원클릭으로 받아온다. AI 호출도 사라진다.
 */
export interface Routine {
  id: string;
  /** 완료 여부와 획득량은 그날그날의 것이므로 뺀다 */
  quest: Omit<Quest, 'completed' | 'earned'>;
  /** 비어 있으면 매일. 0=일 … 6=토 */
  days: number[];
}

let seq = 0;
export function newRoutineId(): string {
  seq += 1;
  return `r${Date.now().toString(36)}${seq.toString(36)}`;
}

export function toRoutine(quest: Quest): Routine {
  // 완료 여부와 획득량은 그날의 것이므로 템플릿에 담지 않는다
  const rest: Omit<Quest, 'completed' | 'earned'> = {
    title: quest.title,
    category: quest.category,
    rank: quest.rank,
    objective: quest.objective,
    rewards: quest.rewards,
    flavor_text: quest.flavor_text,
    debuff: quest.debuff,
    first_step: quest.first_step,
    estimated_minutes: quest.estimated_minutes,
    tips: quest.tips,
  };
  return { id: newRoutineId(), quest: rest, days: [] };
}

/** 그 날짜에 해당하는 상시 의뢰 */
export function routinesFor(routines: Routine[], date: string): Routine[] {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = new Date(y, m - 1, d, 12).getDay();
  return routines.filter(
    (r) => r.days.length === 0 || r.days.includes(weekday),
  );
}

/** 이미 오늘 목록에 있는가. 제목으로 본다 — 같은 일을 두 번 받을 이유가 없다 */
export function alreadyToday(quests: Quest[], routine: Routine): boolean {
  return quests.some((q) => q.title === routine.quest.title);
}

/** 이 퀘스트가 이미 상시 의뢰로 등록돼 있는가 */
export function isRegistered(routines: Routine[], quest: Quest): boolean {
  return routines.some((r) => r.quest.title === quest.title);
}
