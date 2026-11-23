"use client";

// 하단 탭: 홈 · 워크아웃 · 기록 · 프로필 (사용자가 준 운동 화면 그림의 아래 탭)
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS: { href: string; label: string; match: (p: string) => boolean; icon: ReactNode }[] = [
  {
    href: "/",
    label: "홈",
    match: (p) => p === "/",
    icon: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    href: "/exercises",
    label: "워크아웃",
    match: (p) => p.startsWith("/exercises") || p.startsWith("/workout"),
    icon: <path d="M2 12h2M20 12h2M6 7v10M18 7v10M9 5v14M15 5v14M9 12h6" />,
  },
  {
    href: "/history",
    label: "기록",
    match: (p) => p.startsWith("/history"),
    icon: <path d="M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4" />,
  },
  {
    href: "/profile",
    label: "프로필",
    match: (p) => p.startsWith("/profile") || p.startsWith("/character") || p.startsWith("/settings"),
    icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6" />,
  },
];

export default function BottomTabs() {
  const pathname = usePathname() ?? "/";
  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs ${
                  active ? "font-bold text-foreground" : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.4 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {t.icon}
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
