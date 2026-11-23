// 자세 인식 모델 불러오기·인식 (PLAN 작업 6)
// Design Ref: §7 — 모델 파일과 실행 파일을 앱 안(public/mediapipe)에서 불러와 외부로 데이터가 나가지 않게 한다.
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import type { Landmark } from "./landmarks";

const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/pose_landmarker_lite.task";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function create(delegate: "GPU" | "CPU"): Promise<PoseLandmarker> {
  // 큰 라이브러리라 필요할 때만 불러온다
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
  return PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: "VIDEO",
    numPoses: 1, // 여러 명이 보여도 1명만 분석
  });
}

/** 모델을 한 번만 불러와 재사용한다. GPU가 안 되면 CPU로 다시 시도한다. */
export function loadPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = create("GPU")
      .catch(() => create("CPU"))
      .catch((e) => {
        landmarkerPromise = null; // 실패하면 다시 시도할 수 있게 비운다
        throw e;
      });
  }
  return landmarkerPromise;
}

/** 영상 한 장면에서 관절점 33개를 찾는다. 사람이 없으면 null */
export function detectPose(landmarker: PoseLandmarker, video: HTMLVideoElement, timestampMs: number): Landmark[] | null {
  const result = landmarker.detectForVideo(video, timestampMs);
  const first = result.landmarks?.[0];
  return first && first.length ? (first as Landmark[]) : null;
}
