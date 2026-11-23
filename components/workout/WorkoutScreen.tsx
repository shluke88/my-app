"use client";

// 운동 화면. 작업 5~9: 카메라, 자세 인식, 뼈대, 각도, 신뢰도 일시 정지까지. 이후 작업에서 판정·진행을 붙인다.
import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BigButton from "@/components/common/BigButton";
import PageHeader from "@/components/common/PageHeader";
import CameraView from "./CameraView";
import SkeletonOverlay, { type SkeletonHandle } from "./SkeletonOverlay";
import PauseOverlay from "./PauseOverlay";
import DevVideoInput from "./DevVideoInput";
import { CAMERA_ERROR_TEXT, useCamera } from "@/hooks/useCamera";
import { usePoseLoop, type PoseFrame } from "@/hooks/usePoseLoop";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import { ConfidenceGate } from "@/lib/pose/confidence";
import { minVisibility, pickSide, toPose } from "@/lib/pose/landmarks";
import { SquatJudge } from "@/lib/exercise/judges/squat";
import type { ExerciseId } from "@/types";

export default function WorkoutScreen() {
  const params = useSearchParams();
  const exerciseParam = params.get("exercise") as ExerciseId | null;
  const rule = exerciseParam && EXERCISE_RULES[exerciseParam] ? EXERCISE_RULES[exerciseParam] : EXERCISE_RULES.squat;
  const cam = useCamera();
  const skeletonRef = useRef<SkeletonHandle>(null);
  const gateRef = useRef(new ConfidenceGate());
  const [paused, setPaused] = useState(true);
  const squatRef = useRef(new SquatJudge());
  const [counts, setCounts] = useState({ good: 0, shallow: 0 });
  const [lastGrade, setLastGrade] = useState<"good" | "shallow" | null>(null);

  const onFrame = useCallback(
    (f: PoseFrame) => {
      const pose = f.landmarks ? toPose(f.landmarks) : null;
      const side = pose ? pickSide(pose, rule.requiredLandmarks) : "L";
      const minVis = pose ? minVisibility(pose, rule.requiredLandmarks, side) : 0;
      const ev = gateRef.current.update(minVis, f.t);
      if (ev) setPaused(ev === "pause");
      // 인식이 끊기면 진행 중 반복을 버리고, 인식이 좋을 때만 판정한다
      if (ev === "pause") squatRef.current.reset();
      if (pose && !gateRef.current.paused && rule.id === "squat") {
        const out = squatRef.current.update(pose, f.aspect);
        if (out.rep) {
          const grade = out.rep.grade;
          setLastGrade(grade);
          setCounts((c) => (grade === "good" ? { ...c, good: c.good + 1 } : { ...c, shallow: c.shallow + 1 }));
        }
      }
      skeletonRef.current?.draw(f.landmarks, f.width, f.height, !gateRef.current.paused);
    },
    [rule],
  );

  const model = usePoseLoop({ videoRef: cam.videoRef, active: cam.status === "ready", onFrame });

  return (
    <>
      <PageHeader title={`${rule.name} · ${rule.cameraView === "side" ? "측면" : "정면"}`} backHref="/" />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-lg">{rule.placement}</p>
        <div className="relative">
          <CameraView videoRef={cam.videoRef} mirrored={!cam.isFile} className="aspect-[3/4] w-full rounded-2xl">
            <SkeletonOverlay ref={skeletonRef} />
          </CameraView>
          {cam.status === "ready" && paused && <PauseOverlay />}
        </div>
        <p className="text-lg">
          인식 상태:{" "}
          {cam.status !== "ready" ? (
            <span className="text-muted">카메라 꺼짐</span>
          ) : paused ? (
            <span className="font-bold text-warn">● 불안정</span>
          ) : (
            <span className="font-bold text-accent">● 좋음</span>
          )}
        </p>
        {rule.id === "squat" && (
          <div className="rounded-2xl border border-line bg-surface p-4 text-center">
            <p className="text-4xl font-extrabold">
              {counts.good}회{" "}
              {lastGrade && (
                <span key={counts.good + counts.shallow} className={`animate-pop inline-block text-2xl ${lastGrade === "good" ? "text-accent" : "text-warn"}`}>
                  {lastGrade === "good" ? "좋음!" : "얕음"}
                </span>
              )}
            </p>
            <p className="text-muted">얕은 반복 {counts.shallow}회</p>
          </div>
        )}
        {model.status === "slow" &&<p className="text-warn">준비하는 데 시간이 걸리고 있어요…</p>}
        {model.status === "error" && (
          <div className="rounded-2xl border-2 border-danger p-4">
            <p className="font-bold">자세 인식을 준비하지 못했어요.</p>
            <BigButton small variant="secondary" onClick={model.retry} className="mt-2">
              다시 시도
            </BigButton>
          </div>
        )}
        {cam.status === "error" && cam.error && (
          <div className="rounded-2xl border-2 border-danger p-4">
            <p className="text-lg font-bold">{CAMERA_ERROR_TEXT[cam.error].title}</p>
            <p className="text-muted">{CAMERA_ERROR_TEXT[cam.error].help}</p>
          </div>
        )}
        {cam.status === "ready" ? (
          <BigButton variant="secondary" onClick={cam.stop}>
            카메라 끄기
          </BigButton>
        ) : (
          <BigButton onClick={cam.start} disabled={cam.status === "starting"}>
            {cam.status === "error" ? "다시 시도" : "카메라 켜기"}
          </BigButton>
        )}
        <DevVideoInput onFile={cam.startFile} />
      </main>
    </>
  );
}
