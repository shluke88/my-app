// 쉬기 단계 (루틴일 때만, PLAN 작업 28): 남은 초, 다음 운동·목표, 휴대폰 위치 안내, 바로 시작
import BigButton from "@/components/common/BigButton";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import { EXERCISE_INFO } from "@/lib/exercise/info";
import type { ExerciseId } from "@/types";

export function targetText(id: ExerciseId): string {
  const r = EXERCISE_RULES[id];
  if (id === "lunge") return "한쪽 8회 × 2";
  return r.measure === "hold" ? `${r.routineTarget}초` : `${r.routineTarget}회`;
}

export default function RestScreen({ left, next, onSkip }: { left: number; next: ExerciseId; onSkip: () => void }) {
  const r = EXERCISE_RULES[next];
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/95 p-6 text-center">
      <p className="text-xl font-bold text-muted">쉬는 시간</p>
      <p className="text-8xl font-extrabold tabular-nums">{left}</p>
      <div className="w-full rounded-3xl border border-line bg-surface p-5">
        <p className="text-lg">
          다음: <b>{r.name}</b> {targetText(next)} · {r.cameraView === "side" ? "측면" : "정면"}
        </p>
        <p className="mt-2 text-4xl">{EXERCISE_INFO[next].emoji}</p>
        <p className="mt-2 text-muted">{r.placement}</p>
      </div>
      <BigButton onClick={onSkip}>바로 시작 ▶</BigButton>
    </div>
  );
}
