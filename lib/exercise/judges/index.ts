// 운동 id로 판정기를 만든다
import type { ExerciseId } from "@/types";
import { SquatJudge } from "./squat";
import { JumpingJackJudge, LungeJudge, PlankJudge, PushupJudge } from "./others";
import type { Judge } from "./types";

export function createJudge(id: ExerciseId): Judge {
  switch (id) {
    case "squat":
      return new SquatJudge();
    case "lunge":
      return new LungeJudge();
    case "pushup":
      return new PushupJudge();
    case "plank":
      return new PlankJudge();
    case "jumpingJack":
      return new JumpingJackJudge();
  }
}

export type { Judge, JudgeResult } from "./types";
