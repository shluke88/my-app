// 자세 인식 모델(MediaPipe)이 돌려주는 관절점 33개 중 PoseFit이 쓰는 번호와 이름 (순수 데이터·계산)

/** 관절점 한 개: x·y는 0~1 비율, visibility는 0~1 신뢰도 */
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** 화면 비율을 맞춘 2D 점 (각도 계산용) */
export interface Point {
  x: number;
  y: number;
}

/** 왼쪽(L)·오른쪽(R)은 사람 기준 */
export const LANDMARK_INDEX = {
  nose: 0,
  shoulderL: 11,
  shoulderR: 12,
  elbowL: 13,
  elbowR: 14,
  wristL: 15,
  wristR: 16,
  hipL: 23,
  hipR: 24,
  kneeL: 25,
  kneeR: 26,
  ankleL: 27,
  ankleR: 28,
} as const;

export type LandmarkName = keyof typeof LANDMARK_INDEX;

/** 뼈대 선 (그리기용) */
export const SKELETON_EDGES: [LandmarkName, LandmarkName][] = [
  ["shoulderL", "shoulderR"],
  ["shoulderL", "elbowL"],
  ["elbowL", "wristL"],
  ["shoulderR", "elbowR"],
  ["elbowR", "wristR"],
  ["shoulderL", "hipL"],
  ["shoulderR", "hipR"],
  ["hipL", "hipR"],
  ["hipL", "kneeL"],
  ["kneeL", "ankleL"],
  ["hipR", "kneeR"],
  ["kneeR", "ankleR"],
];

/** 한 장면의 관절점에서 이름으로 꺼내기 쉽게 만든 모양 */
export type Pose = Record<LandmarkName, Landmark>;

export function toPose(landmarks: Landmark[]): Pose | null {
  if (!landmarks || landmarks.length < 33) return null;
  const pose = {} as Pose;
  for (const [name, idx] of Object.entries(LANDMARK_INDEX)) pose[name as LandmarkName] = landmarks[idx];
  return pose;
}

/** 비율 좌표를 화면 비율(가로/세로)에 맞춘 점으로 바꾼다. 그래야 각도가 찌그러지지 않는다. */
export function toPoint(l: Landmark, aspect: number): Point {
  return { x: l.x * aspect, y: l.y };
}

const SIDE_JOINTS = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle"] as const;

/** 측면 운동: 필요한 관절의 신뢰도 합이 더 높은 쪽 몸을 고른다 */
export function pickSide(pose: Pose, joints: string[]): "L" | "R" {
  const sum = (side: "L" | "R") =>
    joints
      .filter((j) => (SIDE_JOINTS as readonly string[]).includes(j))
      .reduce((acc, j) => acc + (pose[`${j}${side}` as LandmarkName]?.visibility ?? 0), 0);
  return sum("L") >= sum("R") ? "L" : "R";
}

/** 규칙의 관절 이름("knee", "kneeL" 등)을 실제 관절점 이름으로 바꾼다 */
export function resolveName(name: string, side: "L" | "R"): LandmarkName {
  if (name in LANDMARK_INDEX) return name as LandmarkName;
  return `${name}${side}` as LandmarkName;
}

/** 필수 관절점 중 가장 낮은 신뢰도 */
export function minVisibility(pose: Pose, names: string[], side: "L" | "R"): number {
  let min = 1;
  for (const n of names) min = Math.min(min, pose[resolveName(n, side)]?.visibility ?? 0);
  return min;
}
