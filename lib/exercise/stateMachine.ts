// Design Ref: §2.2 처리 5 — 각도 하나로 반복을 세는 상태 전이 (순수 계산).
// 선 자세(시작 각도 이상) → 하강 인정(하강 각도 이하) → 복귀(시작 각도 이상)를 모두 보면 반복 1회.
// 가장 깊은 각도가 기준 범위 이하면 "좋음"(횟수에 셈), 아니면 "얕음"(횟수 제외).
// 흔들림 대책: 하강과 복귀 경계 사이에 최소 히스테리시스 폭을 보장해 한 번의 움직임을 두 번 세지 않는다.

export type RepGrade = "good" | "shallow";

export interface RepEvent {
  grade: RepGrade;
  /** 이번 반복에서 가장 깊은 각도 */
  deepest: number;
}

export interface AngleRepConfig {
  startDeg: number;
  descendDeg: number;
  goodDeg: number;
  hysteresisDeg: number;
}

type Phase = "idle" | "up" | "down";

export class AngleRepCounter {
  /** idle: 아직 선 자세를 못 봄 / up: 선 자세 / down: 내려간 상태 */
  phase: Phase = "idle";
  private deepest = Infinity;
  private readonly returnDeg: number;

  constructor(private readonly cfg: AngleRepConfig) {
    // 복귀 경계는 하강 경계보다 최소 히스테리시스만큼 높아야 한다
    this.returnDeg = Math.max(cfg.startDeg, cfg.descendDeg + cfg.hysteresisDeg);
  }

  /** 평균 낸 각도를 넣으면, 반복이 끝난 순간에만 결과를 돌려준다 */
  update(angle: number): RepEvent | null {
    if (!Number.isFinite(angle)) return null;
    switch (this.phase) {
      case "idle":
        if (angle >= this.cfg.startDeg) this.phase = "up";
        return null;
      case "up":
        if (angle <= this.cfg.descendDeg) {
          this.phase = "down";
          this.deepest = angle;
        }
        return null;
      case "down":
        this.deepest = Math.min(this.deepest, angle);
        if (angle >= this.returnDeg) {
          const ev: RepEvent = {
            grade: this.deepest <= this.cfg.goodDeg ? "good" : "shallow",
            deepest: this.deepest,
          };
          this.phase = "up";
          this.deepest = Infinity;
          return ev;
        }
        return null;
    }
  }

  /** 지금 내려가 있는 중인지 (진행 중인 반복이 있는지) */
  get inRep(): boolean {
    return this.phase === "down";
  }

  /** 인식 일시 정지: 진행 중 반복을 버리고, 다시 선 자세를 볼 때까지 세지 않는다 */
  reset(): void {
    this.phase = "idle";
    this.deepest = Infinity;
  }
}
