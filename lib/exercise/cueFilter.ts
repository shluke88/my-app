// Design Ref: §9.2 — 안내 필터 (PLAN 작업 12·13). 현재 시각을 인자로 받는 순수 계산.
// - 자세형 오류: 0.5초 이상 이어져야 안내
// - 범위형 오류: 반복이 끝난 순간 판정
// - 한 번에 하나만, 규칙 목록 앞쪽이 우선
// - 음성: 한 반복에 1번(플랭크는 5초 단위마다 1번), 같은 문구는 3초 안에 다시 말하지 않음
import { POSTURE_HOLD_SEC, VOICE_DEDUP_SEC } from "./rules";
import type { CueRule } from "@/types";

export interface CueDecision {
  cue: CueRule;
  /** 음성으로도 말할지 */
  speak: boolean;
}

export class CueFilter {
  private since = new Map<string, number>();
  /** 이번 반복(또는 플랭크 5초 단위)에서 이미 안내한 자세형 문구 */
  private shownThisRep = new Set<string>();
  private spokeThisRep = false;
  private lastSpoken = new Map<string, number>();

  constructor(
    private readonly cues: CueRule[],
    private readonly holdSec = POSTURE_HOLD_SEC,
    private readonly dedupSec = VOICE_DEDUP_SEC,
  ) {}

  private decide(cue: CueRule, t: number): CueDecision {
    const last = this.lastSpoken.get(cue.text);
    const speak = !this.spokeThisRep && (last === undefined || t - last >= this.dedupSec);
    if (speak) {
      this.spokeThisRep = true;
      this.lastSpoken.set(cue.text, t);
    }
    return { cue, speak };
  }

  /** 매 장면: 지금 조건이 맞는 자세형 오류 id들을 넣는다 */
  updatePosture(activeIds: string[], t: number): CueDecision | null {
    for (const id of [...this.since.keys()]) if (!activeIds.includes(id)) this.since.delete(id);
    for (const id of activeIds) if (!this.since.has(id)) this.since.set(id, t);
    // 우선순위 순서로 0.5초 넘은 첫 번째
    for (const cue of this.cues) {
      if (cue.kind !== "posture") continue;
      const s = this.since.get(cue.id);
      if (s !== undefined && t - s >= this.holdSec && !this.shownThisRep.has(cue.id)) {
        this.shownThisRep.add(cue.id);
        return this.decide(cue, t);
      }
    }
    return null;
  }

  /** 반복이 끝난 순간: 범위형 오류 id들을 넣으면 가장 우선인 하나를 돌려주고, 다음 반복을 준비한다 */
  endRep(rangeIds: string[], t: number): CueDecision | null {
    const cue = this.cues.find((c) => c.kind === "range" && rangeIds.includes(c.id));
    const out = cue ? this.decide(cue, t) : null;
    this.nextUnit();
    return out;
  }

  /** 다음 반복(플랭크는 다음 5초 단위)으로 넘어간다 */
  nextUnit(): void {
    this.shownThisRep.clear();
    this.spokeThisRep = false;
  }

  reset(): void {
    this.since.clear();
    this.nextUnit();
  }
}

/** 음성 3초 중복 방지만 따로 쓰는 경우 (다리 바꾸기 안내 등) */
export function canSpeakAgain(last: number | undefined, t: number, dedupSec = VOICE_DEDUP_SEC): boolean {
  return last === undefined || t - last >= dedupSec;
}
