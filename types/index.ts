// Design Ref: §3 — 데이터 모양 정의. 저장 데이터에는 version을 둬서 규칙이 바뀌어도 옮길 수 있게 한다.

/** 운동 종류 */
export type ExerciseId = "squat" | "lunge" | "pushup" | "plank" | "jumpingJack";
/** 성장 부위: 하체, 상체, 코어, 체력 */
export type BodyPart = "lower" | "upper" | "core" | "stamina";

/** 아이템 종류: 덤벨, 케틀벨, 밴드(줄넘기 포함), 매트(폼롤러 포함). 입지 않고 캐릭터 주변 바닥에 놓아 둔다 */
export type ItemSlot = "dumbbell" | "kettlebell" | "band" | "mat";
export type Rarity = "normal" | "rare" | "epic" | "legend";

/** 코드 안의 고정 아이템 데이터 (16개 = 4종류 × 4등급) */
export interface ItemDef {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  /** 그림 파일 크기(px). 화면에서 비율을 맞추는 데 쓴다 */
  w: number;
  h: number;
}

export interface PartProgress {
  /** 1~20 */
  level: number;
  /** 현재 레벨 안에서 쌓인 경험치 */
  xp: number;
}

/** 캐릭터 — 저장 이름: posefit:character */
export interface CharacterState {
  version: number;
  parts: Record<BodyPart, PartProgress>;
  unlockedItemIds: string[];
  equipped: Partial<Record<ItemSlot, string>>;
  updatedAt: string;
}

/** 운동 하나의 결과 */
export interface ExerciseResult {
  exercise: ExerciseId;
  /** 횟수에 센 반복(좋음) 수. 플랭크는 5초 단위 수 */
  goodReps: number;
  /** 얕은 반복 수 (횟수에 세지 않음) */
  shallowReps: number;
  /** 플랭크 기준 자세 누적 시간(초) */
  holdSec?: number;
  /** 안내가 나간 횟수 */
  cueCount: number;
  /** 인식 중단 시간(초) */
  pausedSec: number;
  xpGained: number;
}

/** 세션 기록 — 저장 이름: posefit:sessions (최근 30개) */
export interface SessionRecord {
  id: string;
  startedAt: string;
  mode: "routine" | "single";
  durationSec: number;
  exercises: ExerciseResult[];
  newItemIds: string[];
}

export type Gender = "male" | "female";

/** 설정 — 저장 이름: posefit:settings */
export interface Settings {
  version: number;
  voiceOn: boolean;
  /** 처음 한 번 보여 주는 안전·개인정보 확인(동의)을 마쳤는지 */
  acknowledged: boolean;
  /** 동의 → 카메라 테스트 → 신체정보 첫 사용 단계를 모두 마쳤는지 */
  onboarded: boolean;
  /** 키(cm), 선택 입력. 판정·성장에는 쓰지 않는다 */
  heightCm?: number;
  /** 몸무게(kg), 선택 입력 */
  weightKg?: number;
  /** 성별, 선택 입력. 캐릭터 모습에만 쓰고 판정·성장에는 쓰지 않는다 */
  gender?: Gender;
}

/** 안내 문구 규칙 */
export interface CueRule {
  id: string;
  text: string;
  /** range: 반복 끝에 판정 / posture: 0.5초 이상 이어지면 안내 */
  kind: "range" | "posture";
}

/** 운동 규칙 (lib/exercise/rules.ts에만 둔다) */
export interface ExerciseRule {
  id: ExerciseId;
  name: string;
  bodyPart: BodyPart;
  cameraView: "side" | "front";
  measure: "reps" | "hold";
  /** 필수 관절점 이름. 측면 운동은 신뢰도가 높은 쪽 몸을 쓴다 */
  requiredLandmarks: string[];
  /** 좋음 1회(플랭크는 1단위)의 경험치 */
  xpPerUnit: number;
  /** 얕음 1회의 경험치 */
  xpShallow: number;
  /** 플랭크: 5초 = 1단위 */
  holdUnitSec?: number;
  /** 루틴 목표 (회, 플랭크는 초). 런지는 한쪽 기준 */
  routineTarget: number;
  /** 시작·하강 인정·기준 범위·오류 조건 값 */
  thresholds: Record<string, number>;
  hysteresisDeg: number;
  /** 화면에 보여 줄 카메라 위치 안내 */
  placement: string;
  /** 앞쪽이 우선순위 높음 (최대 2개) */
  cues: CueRule[];
}
