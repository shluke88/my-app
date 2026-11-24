// 운동 판정기 공통 모양. 5종 모두 같은 틀(상태 전이 + 오류 최대 2개)을 따른다.
import type { RepEvent } from "@/lib/exercise/stateMachine";
import type { Pose } from "@/lib/pose/landmarks";

export interface JudgeResult {
  /** 반복이 끝난 순간에만 값이 있다 */
  rep: RepEvent | null;
  /** 반복이 끝난 순간의 범위형 오류 id (우선순위 순서 무관, 필터가 정함) */
  rangeCueIds: string[];
  /** 지금 조건이 맞는 자세형 오류 id */
  postureCueIds: string[];
  /** 판정할 수 있는 자세인지 (푸시업·플랭크: 몸이 수평 30° 이내) */
  valid: boolean;
  /** 플랭크: 이번 장면에서 새로 채운 5초 단위 수 */
  newHoldUnits?: number;
  /** 플랭크: 기준 자세 누적 시간(초) */
  holdSec?: number;
  /** "좋음!" 말풍선을 띄울 관절 위치 (0~1 비율 좌표) */
  focus?: { x: number; y: number };
  /** 측면 운동에서 고른 몸 쪽 (뼈대 강조용) */
  side?: "L" | "R";
  /** 지금 세지 않는 이유 (예: 옆모습이 아님). 화면 카드에 보여 준다 */
  hint?: string;
  /** 개발 모드에서만 보여 줄 측정값 (기준값 조정용) */
  debug?: string;
}

export interface Judge {
  update(pose: Pose, aspect: number, t: number): JudgeResult;
  /** 인식 일시 정지: 진행 중 반복을 버린다 */
  reset(): void;
}
