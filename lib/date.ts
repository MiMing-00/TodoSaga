/** 로컬 타임존 기준 YYYY-MM-DD. UTC를 쓰면 한국 시간 자정~09시 사이가 전날로 밀린다. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const todayKey = () => dateKey(new Date());

/** 날짜 키를 delta일만큼 이동. 정오 기준으로 만들어 서머타임 경계에서 날짜가 튀지 않게 한다. */
export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + delta, 12));
}

/** 오늘부터 거슬러 n일치 키를 과거→현재 순으로 반환 */
export function lastNDays(n: number): string[] {
  const today = todayKey();
  return Array.from({ length: n }, (_, i) => shiftDay(today, i - (n - 1)));
}

export const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function weekdayOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return WEEKDAY[new Date(y, m - 1, d, 12).getDay()];
}

export function formatKorean(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일 (${weekdayOf(key)})`;
}
