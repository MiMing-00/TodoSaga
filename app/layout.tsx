import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
const TAGLINE = "말하는 고양이를 집사로 들였더니 미루던 일이 전부 의뢰서가 되었다";

/**
 * 개발 중에는 앱 이름을 탭에 걸지 않는다.
 *
 * 탭 제목은 옆자리에서 그대로 보인다. 작업 중인 게 게임이라는 걸
 * 굳이 광고할 필요는 없으니, 개발 모드에서는 제목도 파비콘도
 * 평범한 개발 화면으로 바꿔 둔다 (파비콘은 `lib/favicon.ts`).
 */
const DEV = process.env.NODE_ENV === "development";

export const metadata: Metadata = DEV
  ? { title: "localhost:3001 — next dev", description: "development server" }
  : {
      // 없으면 OG 이미지 주소가 localhost:3000으로 굳어서 공유 카드가 안 뜬다
      metadataBase: new URL(SITE_URL),
      title: "나비사가",
      description: TAGLINE,
      openGraph: {
        title: "나비사가",
        description: TAGLINE,
        type: "website",
        locale: "ko_KR",
      },
    };

export const viewport: Viewport = {
  themeColor: "#f4eee0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
