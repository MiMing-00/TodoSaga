import {
  bounds,
  compose,
  GLYPH_W,
  paint,
  toRects,
  upscale,
  PALETTE_VIOLET,
  type Accent,
  type LogoPalette,
} from '@/lib/logotype';

export {
  PALETTE_INK,
  PALETTE_KNOCKOUT,
  PALETTE_PAPER,
  PALETTE_VIOLET,
  type Accent,
  type LogoPalette,
} from '@/lib/logotype';

/**
 * 그린 글자를 SVG로 낸다.
 * 가로로 이어진 같은 색 칸은 한 <rect>로 합친다(PixelSprite와 같은 규칙).
 * shapeRendering="crispEdges"가 없으면 확대할 때 가장자리가 흐려진다.
 */
export function PixelWordmark({
  text,
  px = 3,
  tracking = 3,
  palette = PALETTE_VIOLET,
  outline = true,
  bevel = true,
  drop = [2, 2] as [number, number] | null,
  weight = 2,
  accent = null,
  className = '',
  title,
}: {
  text: string;
  /** 픽셀 한 칸의 CSS 크기 */
  px?: number;
  tracking?: number;
  palette?: LogoPalette;
  outline?: boolean;
  bevel?: boolean;
  drop?: [number, number] | null;
  /** 획 굵기 배수. 2면 획 2칸 + 외곽선 1칸 */
  weight?: number;
  accent?: Accent | null;
  className?: string;
  title?: string;
}) {
  const rows = upscale(compose(text, tracking), weight);
  const cells = paint(rows, { outline, bevel, drop });
  const b = bounds(cells);
  const rects = toRects(cells, palette, accent, (accent?.chars ?? 0) * (GLYPH_W + tracking) * weight);

  return (
    <svg
      viewBox={`${b.minX} ${b.minY} ${b.w} ${b.h}`}
      width={b.w * px}
      height={b.h * px}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={title ?? text}
    >
      {rects.map((r) => (
        <rect
          key={`${r.y}-${r.x}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={r.fill}
        />
      ))}
    </svg>
  );
}
