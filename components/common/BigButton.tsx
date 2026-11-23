import Link from "next/link";
import type { ReactNode } from "react";

// Design Ref: §5.3 — 공통 큰 버튼. 운동 중 멀리서도 누르기 쉽게 높이를 넉넉히 준다.
type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink active:brightness-90",
  secondary: "bg-surface-2 text-foreground active:bg-surface",
  danger: "bg-danger text-white active:brightness-90",
  ghost: "bg-transparent text-foreground border border-surface-2 active:bg-surface",
};

interface BigButtonProps {
  children: ReactNode;
  variant?: Variant;
  /** 주면 링크로, 없으면 버튼으로 그린다 */
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** 작은 크기 (목록 안의 버튼 등) */
  small?: boolean;
  className?: string;
}

export default function BigButton({
  children,
  variant = "primary",
  href,
  onClick,
  disabled,
  small,
  className = "",
}: BigButtonProps) {
  const cls = [
    "flex w-full items-center justify-center gap-2 rounded-2xl font-bold transition select-none",
    small ? "min-h-12 px-4 text-base" : "min-h-16 px-5 text-xl",
    VARIANT_CLASS[variant],
    disabled ? "pointer-events-none opacity-40" : "",
    className,
  ].join(" ");

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
