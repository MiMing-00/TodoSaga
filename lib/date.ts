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

/** today부터 거슬러 n일치 키를 과거→현재 순으로 반환 */
export function lastNDays(n: number, today: string = todayKey()): string[] {
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

/** to - from, 일수. 정오 기준이라 서머타임 경계에서도 하루 단위로 딱 떨어진다 */
export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const a = new Date(y1, m1 - 1, d1, 12).getTime();
  const b = new Date(y2, m2 - 1, d2, 12).getTime();
  return Math.round((b - a) / 86_400_000);
}
