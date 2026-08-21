/**
 * 로고.
 *
 * 본문과 같은 글꼴을 키우기만 하면 '큰 글씨'지 로고가 아니다.
 * Galmuri14에 **두 가지 색**과 이중 하드 섀도를 얹어
 * 글자 덩어리 자체가 하나의 기호로 읽히게 한다.
 *
 * 앞쪽은 원래 TODO였다. 할 일 관리라는 건 알려 주지만 그건 아무 앱이나 하는 말이고,
 * 이 앱에서 실제로 사람을 붙잡는 건 **나비**다. 이름 앞자리는 그 자리에 준다.
 */
export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = {
    sm: 'text-[18px]',
    md: 'text-[24px]',
    lg: 'text-[32px] sm:text-[40px]',
  }[size];

  return (
    <span
      className={`font-logo leading-none ${scale}`}
      style={{
        textShadow: '2px 2px 0 var(--color-ink), 4px 4px 0 var(--color-ink)',
      }}
      aria-label="NabiSaga"
    >
      <span className="text-primary">NABI</span>
      <span className="text-str">SAGA</span>
    </span>
  );
}
