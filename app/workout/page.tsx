import type { Metadata } from "next";
import { Suspense } from "react";
import WorkoutScreen from "@/components/workout/WorkoutScreen";

export const metadata: Metadata = { title: "운동 — PoseFit" };

// ② 운동 화면 (/workout?mode=routine 또는 /workout?exercise=squat)
// 주소의 ?mode·?exercise는 브라우저에서 읽으므로 Suspense로 감싼다.
export default function WorkoutPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted">준비하는 중…</p>}>
      <WorkoutScreen />
    </Suspense>
  );
}
