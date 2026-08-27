/**
 * 로고타입.
 *
 * 폰트로 로고를 만들면 결국 '큰 글씨'다. 굵히려고 text-shadow를 여덟 방향으로
 * 깔면 A·B·G의 속구멍이 메워져서 덩어리가 된다 — 비트맵 글꼴은 굵히는 게 아니라
 * **획을 다시 그려야** 굵어진다.
 *
 * 그래서 캐릭터와 같은 방식을 쓴다. 글자도 데이터다. 5x7 그리드로 직접 그리고
 * 외곽선·베벨·하드섀도는 **코드가 계산**한다. 확대해도 안 뭉개지고,
 * 색은 팔레트만 갈아끼우면 된다.
 */

/** 5x7 대문자. 로고에 쓰는 글자만 있으면 된다 */
const GLYPHS: Record<string, readonly string[]> = {
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  G: ['.###.', '#...#', '#....', '#..##', '#...#', '#...#', '.###.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

export const GLYPH_H = 7;
export const GLYPH_W = 5;

export type Cell = { x: number; y: number; k: string };

/**
 * 글자들을 한 줄로 이어 붙인다.
 * tracking은 글자 사이 빈 칸 수 — 픽셀 로고는 1칸이 기본이고,
 * 넓히면 자간이 아니라 **칸이 벌어진다**(비트맵이라 소수점 자간이 없다).
 */
export function compose(text: string, tracking = 1): string[] {
  const rows: string[] = Array.from({ length: GLYPH_H }, () => '');
  const chars = [...text.toUpperCase()];

  chars.forEach((ch, i) => {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    const gap = i < chars.length - 1 ? '.'.repeat(tracking) : '';
    for (let y = 0; y < GLYPH_H; y += 1) rows[y] += g[y] + gap;
  });

  return rows;
}

/**
 * 그리드를 정수배로 키운다.
 * 획이 1칸이면 외곽선을 두른 뒤에도 로고치고는 가늘다. 2배로 키우면
 * 획 2칸 + 외곽선 1칸이 되어 무게가 생긴다 — 폰트 굵기로는 못 얻는 무게다.
 */
export function upscale(rows: string[], n: number): string[] {
  if (n <= 1) return rows;
  return rows.flatMap((row) =>
    Array.from({ length: n }, () =>
      [...row].map((ch) => ch.repeat(n)).join(''),
    ),
  );
}

export function gridWidth(rows: string[]): number {
  return rows[0]?.length ?? 0;
}

/** 글자 획만 (fill) */
function fillCells(rows: string[]): Cell[] {
  const out: Cell[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') out.push({ x, y, k: 'fill' });
    });
  });
  return out;
}

const has = (rows: string[], x: number, y: number) =>
  rows[y]?.[x] === '#';

/**
 * 외곽선 — 획에 여덟 방향으로 닿아 있는 **빈 칸**만 칠한다.
 * text-shadow와 결정적으로 다른 점: 획 위에는 절대 안 올라가므로
 * 속구멍이 살아남는다.
 */
function outlineCells(rows: string[]): Cell[] {
  const w = gridWidth(rows);
  const out: Cell[] = [];

  for (let y = -1; y <= rows.length; y += 1) {
    for (let x = -1; x <= w; x += 1) {
      if (has(rows, x, y)) continue;
      let touch = false;
      for (let dy = -1; dy <= 1 && !touch; dy += 1)
        for (let dx = -1; dx <= 1 && !touch; dx += 1)
          if (has(rows, x + dx, y + dy)) touch = true;
      if (touch) out.push({ x, y, k: 'line' });
    }
  }

  return out;
}

/**
 * 베벨 — 위쪽이 뚫린 획의 첫 줄만 밝게.
 * 광원을 위에 하나 두는 것만으로 평면이 금속판이 된다. 두 줄을 칠하면
 * 5x7에선 글자가 전부 하이라이트가 되어 버리니 한 줄로 끝낸다.
 */
function bevelCells(rows: string[]): Cell[] {
  const out: Cell[] = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#' && !has(rows, x, y - 1)) out.push({ x, y, k: 'lit' });
    });
  });
  return out;
}

/**
 * 그림자 — **외곽선까지 포함한 실루엣**을 통째로 민다.
 * 획만 밀면 글자 사이사이에 그림자 부스러기가 떠서 지저분해진다.
 * 실루엣을 밀어야 로고 한 덩어리가 종이 위에 떠 있는 것처럼 보인다.
 */
function shadowCells(
  rows: string[],
  silhouette: Cell[],
  dx: number,
  dy: number,
): Cell[] {
  const solid = new Set(silhouette.map((c) => `${c.x},${c.y}`));
  const out: Cell[] = [];
  silhouette.forEach((c) => {
    const sx = c.x + dx;
    const sy = c.y + dy;
    if (solid.has(`${sx},${sy}`)) return;
    out.push({ x: sx, y: sy, k: 'drop' });
  });
  return out;
}

/**
 * 그릴 순서대로 칸을 뱉는다. 뒤에 오는 게 위에 덮인다.
 * drop → line → fill → lit
 */
export function paint(
  rows: string[],
  opts: { outline?: boolean; bevel?: boolean; drop?: [number, number] | null } = {},
): Cell[] {
  const { outline = true, bevel = true, drop = [1, 2] } = opts;
  const fill = fillCells(rows);
  const line = outline ? outlineCells(rows) : [];
  return [
    ...(drop ? shadowCells(rows, [...fill, ...line], drop[0], drop[1]) : []),
    ...line,
    ...fill,
    ...(bevel ? bevelCells(rows) : []),
  ];
}

/** 그린 결과가 차지하는 실제 범위 (외곽선·그림자 포함) */
export function bounds(cells: Cell[]) {
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    minX,
    minY,
    w: Math.max(...xs) - minX + 1,
    h: Math.max(...ys) - minY + 1,
  };
}

export type LogoPalette = {
  fill: string;
  line: string;
  lit: string;
  drop: string;
};

export const PALETTE_VIOLET: LogoPalette = {
  fill: '#5A3FD6',
  line: '#2E2A24',
  lit: '#9B86F0',
  drop: '#2E2A24',
};

export const PALETTE_INK: LogoPalette = {
  fill: '#2E2A24',
  line: '#2E2A24',
  lit: '#6B6154',
  drop: '#A79B87',
};

/** 종이색 글자 + 잉크 외곽선 — 양피지 위에서 '파낸' 느낌 */
export const PALETTE_PAPER: LogoPalette = {
  fill: '#FFFBF0',
  line: '#2E2A24',
  lit: '#FFFFFF',
  drop: '#2E2A24',
};

/** 잉크 명판 위에 뒤집어 올릴 때 */
export const PALETTE_KNOCKOUT: LogoPalette = {
  fill: '#F4EEE0',
  line: '#2E2A24',
  lit: '#FFFFFF',
  drop: '#5A3FD6',
};

/** 앞쪽 몇 글자만 다른 색으로 — NABI / SAGA 투톤용 */
export type Accent = { chars: number; fill: string; lit: string };

export function toRects(
  cells: Cell[],
  palette: LogoPalette,
  accent: Accent | null,
  splitX: number,
) {
  const colorOf = (c: Cell) => {
    if (accent && c.x < splitX && (c.k === 'fill' || c.k === 'lit'))
      return c.k === 'fill' ? accent.fill : accent.lit;
    return palette[c.k as keyof LogoPalette];
  };

  // 나중에 그린 칸이 이긴다 — 좌표별로 마지막 것만 남긴다
  const top = new Map<string, Cell>();
  cells.forEach((c) => top.set(`${c.x},${c.y}`, c));

  const byRow = new Map<number, Cell[]>();
  [...top.values()].forEach((c) => {
    const list = byRow.get(c.y) ?? [];
    list.push(c);
    byRow.set(c.y, list);
  });

  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  byRow.forEach((list, y) => {
    list.sort((a, b) => a.x - b.x);
    let i = 0;
    while (i < list.length) {
      const fill = colorOf(list[i]);
      let w = 1;
      while (
        i + w < list.length &&
        list[i + w].x === list[i].x + w &&
        colorOf(list[i + w]) === fill
      )
        w += 1;
      rects.push({ x: list[i].x, y, w, fill });
      i += w;
    }
  });

  return rects;
}

/**
 * 워드마크를 SVG 문자열로. 리액트가 없는 데서도 같은 로고를 써야 한다
 * (OG 이미지 · 파비콘 생성기).
 */
export function toSvgString({
  text,
  tracking = 3,
  weight = 2,
  drop = [2, 2] as [number, number] | null,
  outline = true,
  bevel = true,
  palette,
  accent = null,
  px = 1,
}: {
  text: string;
  tracking?: number;
  weight?: number;
  drop?: [number, number] | null;
  outline?: boolean;
  bevel?: boolean;
  palette: LogoPalette;
  accent?: Accent | null;
  px?: number;
}) {
  const rows = upscale(compose(text, tracking), weight);
  const cells = paint(rows, { outline, bevel, drop });
  const b = bounds(cells);
  const rects = toRects(
    cells,
    palette,
    accent,
    (accent?.chars ?? 0) * (GLYPH_W + tracking) * weight,
  );

  const body = rects
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="1" fill="${r.fill}"/>`,
    )
    .join('');

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX} ${b.minY} ${b.w} ${b.h}" width="${b.w * px}" height="${b.h * px}" shape-rendering="crispEdges">${body}</svg>`,
    width: b.w * px,
    height: b.h * px,
  };
}
