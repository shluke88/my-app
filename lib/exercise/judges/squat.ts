// 스쿼트 판정 (PLAN 작업 10). 측면에서 신뢰도가 높은 쪽 몸의 엉덩이-무릎-발목 각도로 반복을 센다.
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import { AngleRepCounter, type RepEvent } from "@/lib/exercise/stateMachine";
import { jointAngle, tiltFromVertical } from "@/lib/pose/angles";
import { pickSide, toPoint, type Pose } from "@/lib/pose/landmarks";
import { SmootherSet } from "@/lib/pose/smoothing";

export interface SquatFrame {
  /** 무릎 각도 (평균) */
  knee: number;
  /** 어깨-엉덩이 선이 수직에서 기운 각도 (평균) */
  lean: number;
  rep: RepEvent | null;
}

export class SquatJudge {
  readonly rule = EXERCISE_RULES.squat;
  private counter = new AngleRepCounter({
    startDeg: this.rule.thresholds.startDeg,
    descendDeg: this.rule.thresholds.descendDeg,
    goodDeg: this.rule.thresholds.goodDeg,
    hysteresisDeg: this.rule.hysteresisDeg,
  });
  private smooth = new SmootherSet();

  /** 무릎 각도와 기울기를 직접 넣는 계산 (테스트·다른 입력용) */
  updateAngles(kneeRaw: number, leanRaw: number): SquatFrame {
    const knee = this.smooth.push("knee", kneeRaw);
    const lean = this.smooth.push("lean", leanRaw);
    return { knee, lean, rep: this.counter.update(knee) };
  }

  update(pose: Pose, aspect: number): SquatFrame {
    const side = pickSide(pose, this.rule.requiredLandmarks);
    const p = (n: "shoulder" | "hip" | "knee" | "ankle") => toPoint(pose[`${n}${side}`], aspect);
    return this.updateAngles(jointAngle(p("hip"), p("knee"), p("ankle")), tiltFromVertical(p("shoulder"), p("hip")));
  }

  get inRep(): boolean {
    return this.counter.inRep;
  }

  /** 인식 일시 정지 때 호출: 진행 중 반복을 버린다 */
  reset(): void {
    this.counter.reset();
    this.smooth.reset();
  }
}
