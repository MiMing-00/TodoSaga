import { SPRITE_SIZE, type Grid, type Palette } from '@/lib/sprite';

/**
 * 문자 그리드를 SVG로 그린다.
 * 가로로 연속된 같은 색 칸은 하나의 <rect>로 합쳐 DOM을 줄인다.
 * shapeRendering="crispEdges"가 핵심 — 없으면 확대할 때 가장자리가 뭉개진다.
 */
function runs(grid: Grid, palette: Palette) {
  const out: { x: number; y: number; w: number; fill: string }[] = [];

  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const fill = palette[ch];
      if (!fill) {
        x += 1;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w += 1;
      out.push({ x, y, w, fill });
      x += w;
    }
  });

  return out;
}

export function PixelSprite({
  layers,
  palette,
  size = 64,
  className = '',
}: {
  /** 아래에서 위 순서로 겹쳐 그린다 (몸 → 장비) */
  layers: Grid[];
  palette: Palette;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${SPRITE_SIZE} ${SPRITE_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-hidden
    >
      {layers.flatMap((grid, i) =>
        runs(grid, palette).map((r) => (
          <rect
            key={`${i}-${r.y}-${r.x}`}
            x={r.x}
            y={r.y}
            width={r.w}
            height={1}
            fill={r.fill}
          />
        )),
      )}
    </svg>
  );
}
