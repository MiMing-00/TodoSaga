/**
 * 파비콘.
 *
 * 16px에서 워드마크는 읽히지 않는다. 브랜드를 붙잡는 건 나비(고양이)다.
 *
 * 개발 중에는 **다른 걸 내보낸다.** 탭 제목만 바꿔 봐야 옆자리에서는
 * 보라색 고양이 타일이 그대로 보인다 — 위장은 반쯤 하면 안 하느니만 못하다.
 */
type Tile = { grid: readonly string[]; palette: Record<string, string> };

/** `lib/sprite.ts`의 NABI 정면에서 머리(3~12열 / 1~8행)만 잘라 쓴다 */
const NABI_TILE: Tile = {
  grid: [
    '................',
    '.oooooooooooooo.',
    '.o............o.',
    '.o..ff......ff o',
    '.o..fff....fff o',
    '.o..ffffffffff o',
    '.o..ffffffffff o',
    '.o..ffoffffoff o',
    '.o..ffffppffff o',
    '.o..ffffffffff o',
    '.o...ffffffff.o.',
    '.o............o.',
    '.oooooooooooooo.',
    '................',
    '................',
    '................',
  ],
  palette: { o: '#2E2A24', f: '#F4EEE0', p: '#FF8FBF' },
};

/** 개발용 — 터미널 프롬프트. 에디터 탭 사이에 섞여 눈에 안 띈다 */
const DEV_TILE: Tile = {
  grid: [
    '................',
    '................',
    '...##...........',
    '....##..........',
    '.....##.........',
    '......##........',
    '.......##.......',
    '......##........',
    '.....##.........',
    '....##..........',
    '...##...........',
    '................',
    '.......#######..',
    '.......#######..',
    '................',
    '................',
  ],
  palette: { '#': '#B4B4B4' },
};

const NABI_BG = '#5A3FD6';
const DEV_BG = '#1E1E1E';

function render({ grid, palette }: Tile, bg: string) {
  const rects = [`<rect width="16" height="16" fill="${bg}"/>`];

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
      rects.push(`<rect x="${x}" y="${y}" width="${w}" height="1" fill="${fill}"/>`);
      x += w;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

export function faviconSvg(dev: boolean) {
  return dev ? render(DEV_TILE, DEV_BG) : render(NABI_TILE, NABI_BG);
}
