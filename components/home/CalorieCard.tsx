"use client";

// 홈 아래 열량 카드: 오늘·이번 주·전체(저장된 기록) 소모 열량과 최근 7일 막대.
// 운동 시간 × 운동 강도 × 몸무게로 추정한 값이라 "약"을 붙여 보여 준다.
import Link from "next/link";
import { useSessions, useSettings } from "@/hooks/useStored";
import { formatKcal, kcalLast7Days, kcalSummary } from "@/lib/growth/calories";

export default function CalorieCard() {
  const { sessions, ready } = useSessions();
  const { settings } = useSettings();
  if (!ready) return null;
  const sum = kcalSummary(sessions);
  const days = kcalLast7Days(sessions);
  const max = Math.max(1, ...days.map((d) => d.kcal));

  return (
    <section className="rounded-3xl border border-line bg-surface p-4" aria-label="소모 열량">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold">🔥 소모 열량</h2>
        <span className="text-xs text-muted">추정값</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <Box label="오늘" value={sum.today} strong />
        <Box label="이번 주" value={sum.week} />
        <Box label="전체" value={sum.total} />
      </div>
      {/* 최근 7일 막대 */}
      <div className="mt-3 flex h-20 items-end gap-1.5" aria-hidden="true">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md ${d.isToday ? "bg-gradient-to-t from-primary-2 to-primary" : "bg-surface-2"}`}
              style={{ height: `${Math.max(4, (d.kcal / max) * 56)}px` }}
              title={`${formatKcal(d.kcal)} kcal`}
            />
            <span className={`text-xs ${d.isToday ? "font-bold text-foreground" : "text-muted"}`}>{d.label}</span>
          </div>
        ))}
      </div>
      {!settings.weightKg && (
        <Link href="/settings" className="mt-2 block text-center text-xs text-muted underline underline-offset-2">
          몸무게를 입력하면 더 정확해져요 (지금은 65kg 기준)
        </Link>
      )}
    </section>
  );
}

function Box({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface-2 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-extrabold ${strong ? "text-2xl text-brand" : "text-lg"}`}>
        {formatKcal(value)}
        <span className="ml-0.5 text-xs font-bold text-muted">kcal</span>
      </p>
    </div>
  );
}
