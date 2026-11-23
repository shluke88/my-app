import type { Metadata, Viewport } from "next";
import "./globals.css";

// Design Ref: §5 — 모든 화면은 스마트폰 세로 화면 기준
export const metadata: Metadata = {
  title: "PoseFit — 홈트 자세 코칭",
  description:
    "스마트폰 카메라로 맨몸운동 반복을 세고 짧게 안내하며, 운동한 만큼 도트 캐릭터가 자라는 홈트 웹 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14121f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        {/* 휴대폰 폭에 맞춘 세로 화면 틀. 큰 화면에서는 가운데에 휴대폰 폭으로 보여 준다. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{children}</div>
      </body>
    </html>
  );
}
