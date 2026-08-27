import type { CSSProperties } from 'react';

/**
 * 그림자·재가 UI 자체에 배어드는 방식.
 *
 * docs/LORE.md "녹이란 무엇인가" / "재 — 무리해서 태운 불씨" — 얼룩을
 * 개수로 세서 늘어놓는 방식은 레벨이 커질수록 감당이 안 된다. 그래서
 * 개수가 아니라 **그 존재를 감싼 UI의 색 자체**가 흐려지는 쪽으로
 * 표현한다 — 단계가 아무리 늘어도 색상표 다섯 칸을 clamp해서 고르는
 * 것뿐이라 끄떡없다.
 *
 * 처음엔 둘 다 그냥 갈색이 되는 것처럼 보였다 — 방향이 같아서다.
 * 실제로는 정반대여야 한다:
 *   그림자 = 빛이 없는 것 → 색이 **가라앉는다** (어둡게)
 *   재     = 다 타고 남은 것 → 색이 **빠져나간다** (희끄무레하게, 채도가 죽게)
 * 그래서 그림자는 어두워지고, 재는 바래진다. 반대 방향으로 갈라야
 * "둘 다 그냥 브라운"이라는 인상이 사라진다.
 *
 * 색만으로 안 끝나게, 타이틀바 밑에 얇은 그을음/먼지 띠(grime strip)를
 * 하나 더 깐다 — DESIGN.md "픽셀에 흐림은 없다" 원칙대로 그러데이션이
 * 아니라 체크 무늬로. 색이 바뀌는 것과 실제로 뭔가 앉아 있는 것,
 * 두 가지가 같이 있어야 "그냥 색만 바뀐" 느낌이 안 든다.
 */
export type DecayKind = 'shadow' | 'ash';

interface Stop {
  border: string;
  bg: string;
  /** 타이틀바는 항상 어두워야 흰 글자가 읽힌다 — 그래도 색조는 따라간다 */
  header: string;
  /** 그을음/먼지 띠의 진하기 */
  grimeAlpha: number;
}

const STOPS: Record<DecayKind, Stop[]> = {
  // 가라앉는 쪽 — 어둡고 무겁게
  shadow: [
    { border: '#2e2a24', bg: '#fffbf0', header: '#2e2a24', grimeAlpha: 0 },
    { border: '#2b2823', bg: '#ece6d9', header: '#26221d', grimeAlpha: 0.14 },
    { border: '#26221d', bg: '#d3ccbb', header: '#201c17', grimeAlpha: 0.24 },
    { border: '#201c18', bg: '#b3aa96', header: '#181512', grimeAlpha: 0.34 },
    { border: '#17140f', bg: '#928871', header: '#100e0b', grimeAlpha: 0.46 },
  ],
  // 빠져나가는 쪽 — 색이 죽고 허예지게
  ash: [
    { border: '#2e2a24', bg: '#fffbf0', header: '#2e2a24', grimeAlpha: 0 },
    { border: '#413e38', bg: '#f5f3ed', header: '#37342f', grimeAlpha: 0.16 },
    { border: '#54514a', bg: '#e8e6dd', header: '#403d38', grimeAlpha: 0.26 },
    { border: '#67645b', bg: '#d9d7cb', header: '#4a4740', grimeAlpha: 0.36 },
    { border: '#78756a', bg: '#c8c6b8', header: '#544f47', grimeAlpha: 0.46 },
  ],
};

/** 그을음(먼지)의 색. 그림자는 짙은 먹빛, 재는 밝은 잿빛 — 밝기 방향이 반대다 */
const GRIME_TINT: Record<DecayKind, string> = {
  shadow: '20, 18, 16',
  ash: '250, 248, 242',
};

/** level은 몇이 들어와도 된다 — 색상표 마지막 칸에서 멈출 뿐이다 */
function stopFor(kind: DecayKind, level: number): Stop {
  const stops = STOPS[kind];
  const i = Math.max(0, Math.min(Math.trunc(level) || 0, stops.length - 1));
  return stops[i];
}

export function decayBodyStyle(kind: DecayKind, level: number): CSSProperties {
  const s = stopFor(kind, level);
  return { borderColor: s.border, backgroundColor: s.bg };
}

export function decayHeaderStyle(kind: DecayKind, level: number): CSSProperties {
  const s = stopFor(kind, level);
  return { borderColor: s.border, backgroundColor: s.header };
}

/**
 * 헤더 바로 밑에 까는 얇은 그을음/먼지 띠.
 * 색이 바뀌는 것과 별개로 "뭔가 실제로 앉아 있다"는 인상을 준다.
 */
export function decayGrimeStripStyle(kind: DecayKind, level: number): CSSProperties {
  const s = stopFor(kind, level);
  const rgb = GRIME_TINT[kind];
  return {
    opacity: s.grimeAlpha > 0 ? 1 : 0,
    backgroundImage: `repeating-conic-gradient(rgba(${rgb}, ${s.grimeAlpha}) 0% 25%, transparent 0% 50%)`,
    backgroundSize: '4px 4px',
  };
}
