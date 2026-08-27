'use client';

import { BLOT_A, BLOT_B, type Grid, type Palette } from '@/lib/sprite';
import { PixelSprite } from './PixelSprite';

/**
 * 낡음 한 조각.
 *
 * docs/LORE.md "녹이란 무엇인가" / "재 — 무리해서 태운 불씨" —
 * 그림자는 방치된 자리에 스미는 낡음, 재는 무리해서 태운 자리에 앉는 낡음이다.
 * 같은 성질(스며듦)이라 그리는 방식도 하나로 통일한다. 팔레트만 다르다:
 * 그림자는 먹빛, 재는 잿빛.
 *
 * CSS 원형 그러데이션으로 그렸더니 빗방울처럼 보였다 — 얼룩은 동그랗지
 * 않다. 그래서 나머지 픽셀 그림과 같은 방식(Grid + 팔레트)으로 그린다:
 * 삐뚤빼뚤한 외곽선에 짙은 색(x)과 옅은 색(y)을 섞어 얼룩덜룩하게.
 */
const SHAPES: readonly Grid[] = [BLOT_A, BLOT_B];

const PALETTE: Record<'shadow' | 'ash', Palette> = {
  shadow: { x: '#2e2a24', y: '#57503f' }, // ink / 그을음
  ash: { x: '#a79b87', y: '#cabfa9' }, // ink-disabled / 잿빛
};

export function ShadowBlotch({
  kind,
  shape,
  size,
  opacity,
  style,
  /** 나비의 배경(넓은 화면)처럼 좌표로 흩뿌릴 땐 절대 배치, 목록에 나란히
   *  둘 땐(예: NabiPanel) 호출부에서 static 계열로 바꿔 준다 */
  className = 'pointer-events-none absolute',
}: {
  kind: 'shadow' | 'ash';
  /** SHAPES 인덱스. 얼룩마다 다른 실루엣이어야 한 무더기가 비처럼 안 보인다 */
  shape: number;
  size: number;
  opacity: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const grid = SHAPES[shape % SHAPES.length];

  return (
    <span aria-hidden className={className} style={{ opacity, ...style }}>
      <PixelSprite layers={[grid]} palette={PALETTE[kind]} size={size} />
    </span>
  );
}
