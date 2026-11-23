import Link from "next/link";
import type { ReactNode } from "react";

// Design Ref: §5.3 — 화면 맨 위 제목줄. 뒤로 가기 링크와 오른쪽 자리(설정 버튼 등)를 둔다.
interface PageHeaderProps {
  title: string;
  /** 주면 왼쪽에 "← 뒤로" 링크를 그린다 */
  backHref?: string;
  right?: ReactNode;
}

export default function PageHeader({ title, backHref, right }: PageHeaderProps) {
  return (
    <header className="flex min-h-14 items-center gap-2 px-4 pt-[env(safe-area-inset-top)]">
      <div className="w-20">
        {backHref && (
          <Link href={backHref} className="inline-flex min-h-11 items-center text-lg text-muted">
            ← 뒤로
          </Link>
        )}
      </div>
      <h1 className="flex-1 text-center text-xl font-extrabold">{title}</h1>
      <div className="flex w-20 justify-end">{right}</div>
    </header>
  );
}
