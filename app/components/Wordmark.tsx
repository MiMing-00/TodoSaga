/**
 * 로고.
 *
 * UI 픽셀(Galmuri)과 같은 글꼴을 키우면 로고가 아니라 큰 칩 글씨가 된다.
 * Silkscreen Bold에 **여덟 방향 스트로크**를 얹어 획을 강제로 굵힌다.
 * (웹 폰트 weight만으로는 여기까지 안 굵어진다)
 *
 * 앞쪽은 원래 TODO였다. 할 일 관리라는 건 알려 주지만 그건 아무 앱이나 하는 말이고,
 * 이 앱에서 실제로 사람을 붙잡는 건 **나비**다. 이름 앞자리는 그 자리에 준다.
 */
const FAT = [
  '-1px 0 0 currentColor',
  '1px 0 0 currentColor',
  '0 -1px 0 currentColor',
  '0 1px 0 currentColor',
  '-1px -1px 0 currentColor',
  '1px -1px 0 currentColor',
  '-1px 1px 0 currentColor',
  '1px 1px 0 currentColor',
  '-2px 0 0 currentColor',
  '2px 0 0 currentColor',
  '0 -2px 0 currentColor',
  '0 2px 0 currentColor',
].join(', ');

export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = {
    sm: 'text-[16px]',
    md: 'text-[22px]',
    lg: 'text-[30px] sm:text-[38px]',
  }[size];

  return (
    <span
      className={`font-logo font-bold leading-none ${scale}`}
      aria-label="NabiSaga"
    >
      <span className="text-primary" style={{ textShadow: FAT }}>
        NABI
      </span>
      <span className="text-str" style={{ textShadow: FAT }}>
        SAGA
      </span>
    </span>
  );
}
