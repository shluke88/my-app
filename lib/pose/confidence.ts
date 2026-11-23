// 인식 신뢰도 확인 (PLAN 작업 9) — 현재 시각을 인자로 받는 순수 계산이라 자동 테스트할 수 있다.
// 필수 관절점 중 하나라도 신뢰도 0.6 미만이면 곧바로 일시 정지하고,
// 0.6 이상이 0.5초 이어지면 다시 시작한다. 일시 정지한 시간을 누적한다.
import { MIN_CONFIDENCE, RESUME_AFTER_SEC } from "@/lib/exercise/rules";

export type GateEvent = "pause" | "resume" | null;

export class ConfidenceGate {
  paused = true; // 처음에는 사람이 보일 때까지 멈춘 상태로 시작
  private goodSince: number | null = null;
  private pausedSince: number | null = null;
  private pausedTotal = 0;
  /** 한 번이라도 판정을 시작했는지 (시작 전 대기 시간은 중단 시간에 넣지 않는다) */
  private started = false;

  constructor(
    private readonly minConfidence = MIN_CONFIDENCE,
    private readonly resumeAfterSec = RESUME_AFTER_SEC,
  ) {}

  /** 매 장면 호출. minVis = 필수 관절점 중 가장 낮은 신뢰도, t = 초 */
  update(minVis: number, t: number): GateEvent {
    if (minVis < this.minConfidence) {
      this.goodSince = null;
      if (!this.paused) {
        this.paused = true;
        this.pausedSince = t;
        return "pause";
      }
      return null;
    }
    if (!this.paused) return null;
    if (this.goodSince === null) this.goodSince = t;
    if (t - this.goodSince >= this.resumeAfterSec) {
      if (this.started && this.pausedSince !== null) this.pausedTotal += t - this.pausedSince;
      this.paused = false;
      this.started = true;
      this.pausedSince = null;
      this.goodSince = null;
      return "resume";
    }
    return null;
  }

  /** 지금까지 누적된 인식 중단 시간(초). 진행 중인 중단도 포함 */
  pausedSec(now: number): number {
    const running = this.started && this.paused && this.pausedSince !== null ? now - this.pausedSince : 0;
    return this.pausedTotal + running;
  }
}
