import {
  PALETTE_PAPER,
  PixelWordmark,
  type Accent,
} from '@/app/components/PixelWordmark';

/**
 * 로고.
 *
 * 폰트를 키우면 로고가 아니라 '큰 글씨'다. 굵히려고 text-shadow를 여덟 방향으로
 * 깔면 A·B·G의 속구멍이 메워져 덩어리가 된다 — 특히 상단바(16px)에서 글자가
 * 통째로 뭉개졌다. 그래서 캐릭터와 같은 방식으로 바꿨다: **글자도 데이터다.**
 * 획을 직접 그리고 외곽선·베벨·하드섀도는 코드가 계산한다(`lib/logotype.ts`).
 *
 * 색은 두 마디로 나눈다. NABI는 브랜드 액센트 Saga Violet, SAGA는 종이색을
 * 잉크 외곽선으로 파낸 모양. 예전에는 SAGA에 `--color-str`(STR 카테고리 잉크)을
 * 썼는데, 그건 데이터 전용 색이라 로고가 가져다 쓰면 안 된다.
 */
const ACCENT: Accent = { chars: 4, fill: '#5A3FD6', lit: '#9B86F0' };

/**
 * 크기마다 획 굵기가 다르다 — 작은 데서 획을 2칸으로 두면 속구멍이 1칸만 남아 막힌다.
 *
 * 자간은 **외곽선 두 개가 들어가고도 한 칸이 남아야** 한다. 획 1칸이면 자간 3,
 * 획 2칸이면 (자간도 같이 두 배가 되므로) 자간 3이면 충분하다. 자간을 아끼면
 * 옆 글자 외곽선끼리 붙어서 단어가 한 덩어리가 된다.
 */
const SIZES = {
  sm: { px: 2, weight: 1, tracking: 3, drop: [1, 1] },
  md: { px: 2, weight: 2, tracking: 3, drop: [2, 2] },
  lg: { px: 3, weight: 2, tracking: 3, drop: [2, 2] },
} as const;

export function Wordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = SIZES[size];

  return (
    <PixelWordmark
      text="NABISAGA"
      px={s.px}
      weight={s.weight}
      tracking={s.tracking}
      drop={[s.drop[0], s.drop[1]]}
      palette={PALETTE_PAPER}
      accent={ACCENT}
      title="NabiSaga"
    />
  );
}

/**
 * 로그인 히어로용 2단 엠블럼.
 *
 * 한 줄짜리 워드마크는 가로로 길어서 화면 한가운데 놓으면 그냥 머리글이 된다.
 * NABI를 크게 쌓고 SAGA를 벌려서 아래에 두면 **타이틀 화면**이 된다 —
 * 로그인은 앱에서 유일하게 그렇게 굴어도 되는 화면이다.
 */
export function WordmarkEmblem() {
  return (
    <span className="flex flex-col items-center gap-2" aria-label="NabiSaga">
      <PixelWordmark
        text="NABI"
        px={5}
        weight={2}
        tracking={3}
        drop={[2, 2]}
        accent={ACCENT}
        palette={PALETTE_PAPER}
        title="Nabi"
      />
      <span className="flex items-center gap-2">
        <span className="h-[3px] w-7 bg-ink" aria-hidden />
        <PixelWordmark
          text="SAGA"
          px={3}
          weight={1}
          tracking={4}
          drop={[1, 1]}
          palette={PALETTE_PAPER}
          title="Saga"
        />
        <span className="h-[3px] w-7 bg-ink" aria-hidden />
      </span>
    </span>
  );
}
