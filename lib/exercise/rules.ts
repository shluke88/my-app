// Design Ref: §3·§10 — 판정 숫자·루틴·안내 문구는 이 파일에만 둔다. 시연 뒤 숫자만 바꿔 조정한다.
// PRD 5번 "운동별 판정 기준" 표의 처음 기준값이다.
import type { ExerciseId, ExerciseRule } from "@/types";

/** 필수 관절점 신뢰도가 이 값 미만이면 판정을 멈춘다 */
export const MIN_CONFIDENCE = 0.6;
/** 신뢰도가 회복된 뒤 이 시간(초) 이어지면 판정을 다시 시작한다 */
export const RESUME_AFTER_SEC = 0.5;
/** 각도 흔들림을 줄이려고 평균 내는 최근 장면 수 */
export const SMOOTH_FRAMES = 5;
/** 자세형 오류가 이 시간(초) 이상 이어져야 안내한다 */
export const POSTURE_HOLD_SEC = 0.5;
/** 안내 띠를 보여 주는 시간(초) */
export const CUE_BANNER_SEC = 2;
/** 같은 문구는 이 시간(초) 안에 다시 말하지 않는다 */
export const VOICE_DEDUP_SEC = 3;
/** 푸시업·플랭크는 몸이 수평선과 이 각도 이내일 때만 판정한다 */
export const HORIZONTAL_MAX_DEG = 30;
/** 준비 화면: 인식 좋음이 이 시간(초) 이어지면 카운트다운을 시작한다 */
export const READY_HOLD_SEC = 2;
/** 3·2·1 카운트다운 */
export const COUNTDOWN_SEC = 3;
/** 플랭크: 기준 자세를 한 번 잡은 뒤 자세가 이 시간(초) 넘게 계속 무너지면 플랭크를 끝낸다 (사용자 결정) */
export const PLANK_BREAK_END_SEC = 2;
/** 루틴 운동 사이 쉬는 시간(초). 사용자 결정으로 10초 (PRD 처음 값은 30초) */
export const REST_SEC = 10;
/** 방금 반복의 등급을 보여 주는 시간(초) */
export const GRADE_SHOW_SEC = 1.2;

export const EXERCISE_RULES: Record<ExerciseId, ExerciseRule> = {
  squat: {
    id: "squat",
    name: "스쿼트",
    bodyPart: "lower",
    cameraView: "side",
    measure: "reps",
    requiredLandmarks: ["shoulder", "hip", "knee", "ankle"],
    xpPerUnit: 5,
    xpShallow: 1,
    routineTarget: 12,
    thresholds: {
      startDeg: 150, // 선 자세: 무릎 150° 이상
      descendDeg: 135, // 하강 인정: 135° 이하
      goodDeg: 110, // 기준 범위: 가장 낮은 무릎 각도 110° 이하
      leanMaxDeg: 45, // 어깨-엉덩이 선이 수직에서 45° 넘게 기울면 안내
    },
    hysteresisDeg: 5,
    placement: "휴대폰을 옆에 세워 두고, 몸 옆모습 전체가 보이게 1~3m 뒤로 서 주세요",
    cues: [
      { id: "squat-depth", text: "더 깊이 앉아 보세요", kind: "range" },
      { id: "squat-lean", text: "상체를 조금 세워 보세요", kind: "posture" },
    ],
  },
  lunge: {
    id: "lunge",
    name: "런지",
    bodyPart: "lower",
    cameraView: "side",
    measure: "reps",
    requiredLandmarks: ["shoulder", "hip", "kneeL", "kneeR", "ankleL", "ankleR"],
    xpPerUnit: 5,
    xpShallow: 1,
    routineTarget: 8, // 한쪽 8회 + 반대쪽 8회
    thresholds: {
      startDeg: 150,
      descendDeg: 135,
      goodDeg: 110,
      leanMaxDeg: 20,
    },
    hysteresisDeg: 5,
    placement: "휴대폰을 옆에 세워 두고, 몸 옆모습 전체가 보이게 1~3m 뒤로 서 주세요",
    cues: [
      { id: "lunge-depth", text: "더 깊이 내려가 보세요", kind: "range" },
      { id: "lunge-lean", text: "상체를 세워 보세요", kind: "posture" },
    ],
  },
  pushup: {
    id: "pushup",
    name: "푸시업",
    bodyPart: "upper",
    cameraView: "side",
    measure: "reps",
    requiredLandmarks: ["shoulder", "elbow", "wrist", "hip", "ankle"],
    xpPerUnit: 15,
    xpShallow: 3,
    routineTarget: 8,
    thresholds: {
      startDeg: 150, // 팔꿈치 150° 이상
      descendDeg: 120,
      goodDeg: 90,
      hipLineMinDeg: 160, // 어깨-엉덩이-발목 각도 160° 미만이면 안내
    },
    hysteresisDeg: 5,
    placement: "휴대폰을 바닥 옆쪽에 세워 두고, 엎드린 몸 옆모습 전체가 보이게 해 주세요",
    cues: [
      { id: "pushup-depth", text: "더 내려가 보세요", kind: "range" },
      { id: "pushup-hip", text: "엉덩이를 몸과 일직선으로", kind: "posture" },
    ],
  },
  plank: {
    id: "plank",
    name: "플랭크",
    bodyPart: "core",
    cameraView: "side",
    measure: "hold",
    requiredLandmarks: ["shoulder", "hip", "ankle"],
    xpPerUnit: 20,
    xpShallow: 0,
    holdUnitSec: 5,
    routineTarget: 30, // 초
    thresholds: {
      // 사용자 시험 결과 165°·30°는 너무 까다로워 시간이 안 올라가서 넉넉하게 낮춤 (카메라가 비스듬해도 잡히게)
      alignMinDeg: 150, // 어깨-엉덩이-발목 150° 이상이면 기준 자세
      horizontalMaxDeg: 40, // 어깨-발목 선이 바닥과 40° 이내면 엎드린 자세로 봄
    },
    hysteresisDeg: 5,
    placement: "휴대폰을 바닥 옆쪽에 세워 두고, 엎드린 몸 옆모습 전체가 보이게 해 주세요",
    cues: [
      { id: "plank-hip-high", text: "엉덩이를 내려 주세요", kind: "posture" },
      { id: "plank-hip-low", text: "엉덩이를 올려 주세요", kind: "posture" },
    ],
  },
  jumpingJack: {
    id: "jumpingJack",
    name: "점핑잭",
    bodyPart: "stamina",
    cameraView: "front",
    measure: "reps",
    requiredLandmarks: ["shoulderL", "shoulderR", "wristL", "wristR", "hipL", "hipR", "ankleL", "ankleR"],
    xpPerUnit: 6,
    xpShallow: 1,
    routineTarget: 20,
    thresholds: {
      closedFeetMax: 1.0, // 모음: 발 간격이 어깨너비 1.0배 이하, 손목이 어깨 아래
      openFeetMin: 1.2, // 벌림 인정: 발 간격 1.2배 이상 (또는 손목이 어깨 높이 근처)
      wristNearShoulder: 0.15, // 손목이 어깨 높이 ± (어깨너비 × 0.15) 이내면 "어깨 높이 근처"
      goodFeetMin: 1.5, // 좋음: 발 간격 1.5배 이상
    },
    hysteresisDeg: 5,
    placement: "휴대폰을 정면에 세워 두고, 머리부터 발끝까지 보이게 2~3m 뒤로 서 주세요",
    cues: [
      { id: "jj-arms", text: "팔을 더 높이 올려 보세요", kind: "range" },
      { id: "jj-legs", text: "다리를 더 벌려 보세요", kind: "range" },
    ],
  },
};

/** 기본 루틴 순서 (PRD: 점핑잭 → 스쿼트 → 푸시업 → 런지 → 플랭크) */
export const ROUTINE: ExerciseId[] = ["jumpingJack", "squat", "pushup", "lunge", "plank"];

/** 운동 하나 모드 버튼 순서 */
export const SINGLE_ORDER: ExerciseId[] = ["squat", "lunge", "pushup", "plank", "jumpingJack"];

export const LUNGE_SWITCH_TEXT = "다리를 바꿔 주세요";
export const PAUSE_TEXT = "전신이 보이게 서 주세요";
