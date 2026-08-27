import { ImageResponse } from 'next/og';

import { PALETTE_PAPER, toSvgString } from '@/lib/logotype';

export const alt = '나비사가';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * 공유 카드.
 *
 * 링크를 처음 보는 사람에게 보이는 유일한 화면이라 앱과 같은 문법이어야 한다 —
 * 양피지 바닥, 잉크 보더, 하드 오프셋 그림자. 로고는 `lib/logotype`이 그린 것을
 * 그대로 쓴다(폰트를 안 쓰므로 웹폰트 로딩에 기대지 않는다).
 */
/** 픽셀 한글은 Galmuri11이 낸다. 빌드 때 한 번만 받아 온다 */
async function galmuri() {
  const res = await fetch('https://cdn.jsdelivr.net/npm/galmuri/dist/Galmuri11.ttf');
  if (!res.ok) throw new Error(`Galmuri11 fetch failed: ${res.status}`);
  return res.arrayBuffer();
}

export default async function Image() {
  const font = await galmuri();
  const logo = toSvgString({
    text: 'NABISAGA',
    palette: PALETTE_PAPER,
    accent: { chars: 4, fill: '#5A3FD6', lit: '#9B86F0' },
    px: 8,
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 44,
          background: '#F4EEE0',
        }}
      >
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(logo.svg)}`}
          width={logo.width}
          height={logo.height}
          alt=""
        />
        <div
          style={{
            display: 'flex',
            border: '6px solid #2E2A24',
            background: '#FFFBF0',
            boxShadow: '12px 12px 0 0 #2E2A24',
            padding: '22px 38px',
            fontFamily: 'Galmuri11',
            fontSize: 30,
            lineHeight: 1.5,
            color: '#2E2A24',
          }}
        >
          말하는 고양이를 집사로 들였더니 미루던 일이 전부 의뢰서가 되었다
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Galmuri11', data: font, style: 'normal', weight: 400 }],
    },
  );
}
