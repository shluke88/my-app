import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import BottomTabs from "@/components/common/BottomTabs";
import { EXERCISE_RULES, SINGLE_ORDER } from "@/lib/exercise/rules";
import { EXERCISE_INFO } from "@/lib/exercise/info";

export const metadata: Metadata = { title: "운동 선택 — PoseFit" };

// 운동 하나만 하기: 운동을 골라 "그만"을 누를 때까지 자유롭게 한다 (PLAN 작업 27)
export default function ExercisesPage() {
  return (
    <>
      <PageHeader title="운동 하나만 하기" backHref="/" />
      <main className="flex flex-1 flex-col gap-3 px-4 pb-6">
        <p className="text-muted">목표 횟수 없이, &ldquo;중단&rdquo;을 누를 때까지 셉니다.</p>
        {SINGLE_ORDER.map((id) => {
          const r = EXERCISE_RULES[id];
          const info = EXERCISE_INFO[id];
          return (
            <Link
              key={id}
              href={`/workout?exercise=${id}`}
              className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-sm active:bg-surface-2"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-light-card to-light-card-2 text-3xl">{info.emoji}</span>
              <span className="flex-1">
                <span className="block text-xl font-extrabold">{r.name}</span>
                <span className="block text-sm text-muted">{info.summary}</span>
              </span>
              <span className="text-2xl text-muted">›</span>
            </Link>
          );
        })}
      </main>
      <BottomTabs />
    </>
  );
}
