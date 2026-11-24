// 스쿼트 판정 (PLAN 작업 10·12). 측면에서 신뢰도가 높은 쪽 몸의 엉덩이-무릎-발목 각도로 반복을 센다.
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import { AngleRepCounter, type RepEvent } from "@/lib/exercise/stateMachine";
import { jointAngle, tiltFromVertical } from "@/lib/pose/angles";
import { pickSide, toPoint, type Pose } from "@/lib/pose/landmarks";
import { SmootherSet } from "@/lib/pose/smoothing";
import type { Judge, JudgeResult } from "./types";

const rule = EXERCISE_RULES.squat;

export class SquatJudge implements Judge {
  private counter = new AngleRepCounter({
    startDeg: rule.thresholds.startDeg,
    descendDeg: rule.thresholds.descendDeg,
    goodDeg: rule.thresholds.goodDeg,
    hysteresisDeg: rule.hysteresisDeg,
  });
  private smooth = new SmootherSet();

  /** 무릎 각도와 기울기를 직접 넣는 계산 (테스트용) */
  updateAngles(kneeRaw: number, leanRaw: number): { knee: number; lean: number; rep: RepEvent | null } {
    const knee = this.smooth.push("knee", kneeRaw);
    const lean = this.smooth.push("lean", leanRaw);
    return { knee, lean, rep: this.counter.update(knee) };
  }

  update(pose: Pose, aspect: number): JudgeResult {
    const side = pickSide(pose, rule.requiredLandmarks);
    const p = (n: "shoulder" | "hip" | "knee" | "ankle") => toPoint(pose[`${n}${side}`], aspect);
    const { knee: kneeDeg, lean, rep } = this.updateAngles(jointAngle(p("hip"), p("knee"), p("ankle")), tiltFromVertical(p("shoulder"), p("hip")));
    const knee = pose[`knee${side}`];
    return {
      rep,
      rangeCueIds: rep?.grade === "shallow" ? ["squat-depth"] : [],
      // 내려가 있는 동안 상체가 45° 넘게 기울면
      postureCueIds: this.counter.inRep && lean > rule.thresholds.leanMaxDeg ? ["squat-lean"] : [],
      valid: true,
      focus: { x: knee.x, y: knee.y },
      side,
      debug: `무릎 ${Math.round(kneeDeg)}°(하강 ${rule.thresholds.descendDeg}° · 좋음 ${rule.thresholds.goodDeg}° 이하) · 상체 기울기 ${Math.round(lean)}°`,
    };
  }

  reset(): void {
    this.counter.reset();
    this.smooth.reset();
  }
}
