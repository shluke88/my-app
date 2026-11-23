// 런지·푸시업·플랭크·점핑잭 판정 (PLAN 작업 23~26). 스쿼트와 같은 틀을 따른다.
import { EXERCISE_RULES, HORIZONTAL_MAX_DEG } from "@/lib/exercise/rules";
import { AngleRepCounter, type RepEvent } from "@/lib/exercise/stateMachine";
import { jointAngle, offsetFromLine, tiltFromHorizontal, tiltFromVertical } from "@/lib/pose/angles";
import { pickSide, toPoint, type Pose } from "@/lib/pose/landmarks";
import { SmootherSet } from "@/lib/pose/smoothing";
import type { Judge, JudgeResult } from "./types";

function angleCounter(id: "lunge" | "pushup") {
  const r = EXERCISE_RULES[id];
  return new AngleRepCounter({
    startDeg: r.thresholds.startDeg,
    descendDeg: r.thresholds.descendDeg,
    goodDeg: r.thresholds.goodDeg,
    hysteresisDeg: r.hysteresisDeg,
  });
}

/* ───── 런지: 더 많이 굽힌 무릎 각도 ───── */
export class LungeJudge implements Judge {
  private rule = EXERCISE_RULES.lunge;
  private counter = angleCounter("lunge");
  private smooth = new SmootherSet();

  update(pose: Pose, aspect: number): JudgeResult {
    const side = pickSide(pose, ["shoulder", "hip"]);
    const P = (n: keyof Pose) => toPoint(pose[n], aspect);
    const kneeL = jointAngle(P("hipL"), P("kneeL"), P("ankleL"));
    const kneeR = jointAngle(P("hipR"), P("kneeR"), P("ankleR"));
    const bentSide = kneeL <= kneeR ? "L" : "R";
    const knee = this.smooth.push("knee", Math.min(kneeL, kneeR));
    const lean = this.smooth.push("lean", tiltFromVertical(P(`shoulder${side}`), P(`hip${side}`)));
    const rep = this.counter.update(knee);
    const k = pose[`knee${bentSide}`];
    return {
      rep,
      rangeCueIds: rep?.grade === "shallow" ? ["lunge-depth"] : [],
      postureCueIds: this.counter.inRep && lean > this.rule.thresholds.leanMaxDeg ? ["lunge-lean"] : [],
      valid: true,
      focus: { x: k.x, y: k.y },
      side,
    };
  }
  reset() {
    this.counter.reset();
    this.smooth.reset();
  }
}

/* ───── 푸시업: 팔꿈치 각도, 몸이 수평 30° 이내일 때만 ───── */
export class PushupJudge implements Judge {
  private rule = EXERCISE_RULES.pushup;
  private counter = angleCounter("pushup");
  private smooth = new SmootherSet();

  update(pose: Pose, aspect: number): JudgeResult {
    const side = pickSide(pose, this.rule.requiredLandmarks);
    const p = (n: "shoulder" | "elbow" | "wrist" | "hip" | "ankle") => toPoint(pose[`${n}${side}`], aspect);
    const horizontal = tiltFromHorizontal(p("shoulder"), p("ankle")) <= HORIZONTAL_MAX_DEG;
    const e = pose[`elbow${side}`];
    if (!horizontal) {
      // 서 있는 자세에서 팔을 굽혀도 세지 않는다
      this.counter.reset();
      this.smooth.reset();
      return { rep: null, rangeCueIds: [], postureCueIds: [], valid: false, focus: { x: e.x, y: e.y }, side };
    }
    const elbow = this.smooth.push("elbow", jointAngle(p("shoulder"), p("elbow"), p("wrist")));
    const hipLine = this.smooth.push("hip", jointAngle(p("shoulder"), p("hip"), p("ankle")));
    const rep = this.counter.update(elbow);
    return {
      rep,
      rangeCueIds: rep?.grade === "shallow" ? ["pushup-depth"] : [],
      postureCueIds: hipLine < this.rule.thresholds.hipLineMinDeg ? ["pushup-hip"] : [],
      valid: true,
      focus: { x: e.x, y: e.y },
      side,
    };
  }
  reset() {
    this.counter.reset();
    this.smooth.reset();
  }
}

/* ───── 플랭크: 일직선(165° 이상) + 수평인 시간을 누적, 5초 = 1단위 ───── */
export class PlankJudge implements Judge {
  private rule = EXERCISE_RULES.plank;
  private smooth = new SmootherSet();
  private holdSec = 0;
  private units = 0;
  private lastT: number | null = null;

  update(pose: Pose, aspect: number, t: number): JudgeResult {
    const side = pickSide(pose, this.rule.requiredLandmarks);
    const p = (n: "shoulder" | "hip" | "ankle") => toPoint(pose[`${n}${side}`], aspect);
    const dt = this.lastT === null ? 0 : Math.min(0.5, Math.max(0, t - this.lastT));
    this.lastT = t;
    const horizontal = tiltFromHorizontal(p("shoulder"), p("ankle")) <= HORIZONTAL_MAX_DEG;
    const h = pose[`hip${side}`];
    if (!horizontal) return { rep: null, rangeCueIds: [], postureCueIds: [], valid: false, holdSec: this.holdSec, focus: { x: h.x, y: h.y }, side };
    const align = this.smooth.push("align", jointAngle(p("shoulder"), p("hip"), p("ankle")));
    const aligned = align >= this.rule.thresholds.alignMinDeg;
    let posture: string[] = [];
    if (aligned) this.holdSec += dt;
    else posture = [offsetFromLine(p("hip"), p("shoulder"), p("ankle")) < 0 ? "plank-hip-high" : "plank-hip-low"];
    const units = Math.floor(this.holdSec / (this.rule.holdUnitSec ?? 5));
    const newUnits = units - this.units;
    this.units = units;
    return { rep: null, rangeCueIds: [], postureCueIds: posture, valid: true, newHoldUnits: newUnits, holdSec: this.holdSec, focus: { x: h.x, y: h.y }, side };
  }

  /** 누적 시간 계산만 따로 (테스트용): 기준 자세인 구간의 길이를 차례로 더한다 */
  addAligned(sec: number): number {
    this.holdSec += sec;
    const units = Math.floor(this.holdSec / (this.rule.holdUnitSec ?? 5));
    const n = units - this.units;
    this.units = units;
    return n;
  }

  /** 일시 정지해도 누적 시간은 유지하고, 시간 간격만 새로 잰다 */
  reset() {
    this.lastT = null;
    this.smooth.reset();
  }
}

/* ───── 점핑잭: 정면, 모음 → 벌림 → 모음 ───── */
export class JumpingJackJudge implements Judge {
  private th = EXERCISE_RULES.jumpingJack.thresholds;
  private phase: "idle" | "closed" | "open" = "idle";
  private maxFeet = 0;
  private armsUp = false;

  /** 측정값을 직접 넣는 계산 (테스트용). feet = 발 간격 / 어깨너비, wristRise = (어깨 y - 손목 y) / 어깨너비 */
  updateMeasures(feet: number, wristRise: number): RepEvent | null {
    const wristsAbove = wristRise > 0;
    const wristsNear = wristRise > -this.th.wristNearShoulder;
    const closed = feet <= this.th.closedFeetMax && !wristsNear;
    const open = wristsNear || feet >= this.th.openFeetMin;
    if (this.phase === "idle") {
      if (closed) this.phase = "closed";
      return null;
    }
    if (this.phase === "closed") {
      if (open) {
        this.phase = "open";
        this.maxFeet = feet;
        this.armsUp = wristsAbove;
      }
      return null;
    }
    this.maxFeet = Math.max(this.maxFeet, feet);
    this.armsUp ||= wristsAbove;
    if (closed) {
      this.phase = "closed";
      const good = this.armsUp && this.maxFeet >= this.th.goodFeetMin;
      return { grade: good ? "good" : "shallow", deepest: this.maxFeet };
    }
    return null;
  }

  private lastRange: string[] = [];

  update(pose: Pose): JudgeResult {
    const sw = Math.max(1e-3, Math.abs(pose.shoulderL.x - pose.shoulderR.x));
    const feet = Math.abs(pose.ankleL.x - pose.ankleR.x) / sw;
    const shoulderY = (pose.shoulderL.y + pose.shoulderR.y) / 2;
    // 두 손목 중 더 낮은 쪽 기준 (y가 클수록 아래)
    const wristY = Math.max(pose.wristL.y, pose.wristR.y);
    const armsUpBefore = this.armsUp;
    const maxFeetBefore = this.maxFeet;
    const rep = this.updateMeasures(feet, (shoulderY - wristY) / sw);
    this.lastRange = [];
    if (rep?.grade === "shallow") {
      if (!(armsUpBefore || this.armsUp)) this.lastRange.push("jj-arms");
      if (Math.max(maxFeetBefore, rep.deepest) < this.th.goodFeetMin) this.lastRange.push("jj-legs");
    }
    return {
      rep,
      rangeCueIds: this.lastRange,
      postureCueIds: [],
      valid: true,
      focus: { x: (pose.hipL.x + pose.hipR.x) / 2, y: (pose.hipL.y + pose.hipR.y) / 2 },
    };
  }
  reset() {
    this.phase = "idle";
    this.maxFeet = 0;
    this.armsUp = false;
  }
}
