"use client";

// 카메라 테스트: 전면 카메라를 켜고 자세 인식이 전신을 안정적으로 잡는지 보여 준다.
// 첫 사용 단계와 설정의 "카메라 테스트 다시 하기"에서 함께 쓴다.
import { useCallback, useEffect, useRef, useState } from "react";
import BigButton from "@/components/common/BigButton";
import CameraView from "./CameraView";
import SkeletonOverlay, { type SkeletonHandle } from "./SkeletonOverlay";
import { CAMERA_ERROR_TEXT, useCamera } from "@/hooks/useCamera";
import { usePoseLoop, type PoseFrame } from "@/hooks/usePoseLoop";
import { ConfidenceGate } from "@/lib/pose/confidence";
import { minVisibility, toPose } from "@/lib/pose/landmarks";

/** 전신(어깨·엉덩이·무릎·발목 양쪽)이 보이는지 확인한다 */
const FULL_BODY = ["shoulderL", "shoulderR", "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR"];

interface Props {
  /** 인식 좋음 상태가 바뀔 때 */
  onGoodChange?: (good: boolean) => void;
}

export default function CameraCheck({ onGoodChange }: Props) {
  const cam = useCamera();
  const skeletonRef = useRef<SkeletonHandle>(null);
  const gateRef = useRef(new ConfidenceGate());
  const [good, setGood] = useState(false);
  const onGoodRef = useRef(onGoodChange);
  useEffect(() => {
    onGoodRef.current = onGoodChange;
  }, [onGoodChange]);

  const onFrame = useCallback((f: PoseFrame) => {
    const pose = f.landmarks ? toPose(f.landmarks) : null;
    const ev = gateRef.current.update(pose ? minVisibility(pose, FULL_BODY, "L") : 0, f.t);
    if (ev) {
      const ok = ev === "resume";
      setGood(ok);
      onGoodRef.current?.(ok);
    }
    skeletonRef.current?.draw(f.landmarks, f.width, f.height, !gateRef.current.paused);
  }, []);

  const model = usePoseLoop({ videoRef: cam.videoRef, active: cam.status === "ready", onFrame });

  return (
    <div className="space-y-3">
      <CameraView videoRef={cam.videoRef} mirrored={!cam.isFile} className="aspect-[3/4] w-full rounded-3xl">
        <SkeletonOverlay ref={skeletonRef} />
      </CameraView>
      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-lg">
        <span>인식 상태</span>
        {cam.status !== "ready" ? (
          <span className="text-muted">카메라 꺼짐</span>
        ) : model.status !== "ready" ? (
          <span className="text-muted">{model.status === "error" ? "준비 실패" : "준비 중…"}</span>
        ) : good ? (
          <span className="font-bold text-accent">● 좋음</span>
        ) : (
          <span className="font-bold text-warn">● 전신이 보이게 서 주세요</span>
        )}
      </div>
      {model.status === "slow" && <p className="text-warn">준비하는 데 시간이 걸리고 있어요…</p>}
      {model.status === "error" && (
        <BigButton small variant="secondary" onClick={model.retry}>
          자세 인식 다시 준비하기
        </BigButton>
      )}
      {cam.status === "error" && cam.error && (
        <div className="rounded-2xl border-2 border-danger bg-surface p-4">
          <p className="text-lg font-bold">{CAMERA_ERROR_TEXT[cam.error].title}</p>
          <p className="text-muted">{CAMERA_ERROR_TEXT[cam.error].help}</p>
        </div>
      )}
      {cam.status !== "ready" && (
        <BigButton variant="secondary" onClick={cam.start} disabled={cam.status === "starting"}>
          📷 {cam.status === "error" ? "카메라 다시 켜기" : "카메라 켜기"}
        </BigButton>
      )}
    </div>
  );
}
