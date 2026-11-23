"use client";

// 운동 화면. 작업 5: 카메라 켜기·끄기와 오류 안내까지. 이후 작업에서 인식·판정·진행을 붙인다.
import { useSearchParams } from "next/navigation";
import BigButton from "@/components/common/BigButton";
import PageHeader from "@/components/common/PageHeader";
import CameraView from "./CameraView";
import { CAMERA_ERROR_TEXT, useCamera } from "@/hooks/useCamera";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import type { ExerciseId } from "@/types";

export default function WorkoutScreen() {
  const params = useSearchParams();
  const exerciseParam = params.get("exercise") as ExerciseId | null;
  const rule = exerciseParam && EXERCISE_RULES[exerciseParam] ? EXERCISE_RULES[exerciseParam] : EXERCISE_RULES.squat;
  const cam = useCamera();

  return (
    <>
      <PageHeader title={`${rule.name} · ${rule.cameraView === "side" ? "측면" : "정면"}`} backHref="/" />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-lg">{rule.placement}</p>
        <CameraView videoRef={cam.videoRef} mirrored={!cam.isFile} className="aspect-[3/4] w-full rounded-2xl" />
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
      </main>
    </>
  );
}
