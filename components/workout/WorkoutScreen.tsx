"use client";

// ② 운동 화면 — 사용자가 준 그림처럼: 어두운 위 막대(뒤로·운동 이름·세트·중단), 화면을 꽉 채운 카메라와 뼈대,
// 위쪽 파란 안내 띠, 관절 옆 "좋음!" 말풍선, 왼쪽 아래 "레벨 업!", 아래 흰 카드(반복 수/목표·얕은 횟수·진행 점), 하단 탭.
// 단계: 준비(소리 켜고 시작 → 인식 좋음 2초 → 3·2·1) → 운동 → (루틴) 쉬기 → 결과
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BigButton from "@/components/common/BigButton";
import BottomTabs from "@/components/common/BottomTabs";
import SkeletonOverlay, { type SkeletonHandle } from "./SkeletonOverlay";
import PauseOverlay from "./PauseOverlay";
import DevVideoInput from "./DevVideoInput";
import RestScreen from "./RestScreen";
import ResultSummary from "./ResultSummary";
import { CAMERA_ERROR_TEXT, useCamera } from "@/hooks/useCamera";
import { usePoseLoop, type PoseFrame } from "@/hooks/usePoseLoop";
import { orderFor, useWorkoutSession } from "@/hooks/useWorkoutSession";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import { EXERCISE_INFO } from "@/lib/exercise/info";
import type { ExerciseId } from "@/types";

export default function WorkoutScreen() {
  const params = useSearchParams();
  const mode = params.get("mode") === "routine" ? "routine" : "single";
  const exParam = params.get("exercise") as ExerciseId | null;
  const single: ExerciseId = exParam && EXERCISE_RULES[exParam] ? exParam : "squat";
  const order = useMemo(() => orderFor(mode, single), [mode, single]);

  const s = useWorkoutSession(order, mode);
  const { videoRef, status: camStatus, error: camError, isFile, start: camStart, startFile, stop: camStop } = useCamera({
    onLost: s.stop,
  });
  const skeletonRef = useRef<SkeletonHandle>(null);
  const [aspect, setAspect] = useState(3 / 4);
  const [showInfo, setShowInfo] = useState(false);
  const { onFrame: sessionFrame, side, paused } = s;

  const onFrame = useCallback(
    (f: PoseFrame) => {
      const ar = f.width / f.height;
      setAspect((old) => (Math.abs(old - ar) < 0.01 ? old : ar));
      sessionFrame(f);
      skeletonRef.current?.draw(f.landmarks, f.width, f.height, !paused, side);
    },
    [sessionFrame, paused, side],
  );
  const model = usePoseLoop({ videoRef: videoRef, active: camStatus === "ready", onFrame });

  const mirrored = !isFile;
  const r = s.rule;
  const isHold = r.measure === "hold";
  const target = mode === "routine" ? r.routineTarget : null;

  if (s.phase === "result" && s.savedSession) {
    return (
      <div className="flex h-dvh flex-col">
        <ResultSummary session={s.savedSession} startLevels={s.startLevels} />
        <BottomTabs />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-black">
      {/* 위 막대 */}
      <header className="z-30 flex items-center gap-2 bg-[#252a3a] px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-white">
        <Link href="/" className="flex min-h-11 items-center gap-1 text-lg font-bold" onClick={() => camStop()}>
          <span className="text-2xl">‹</span> PoseFit
        </Link>
        <div className="flex-1 text-center">
          <button type="button" onClick={() => setShowInfo((v) => !v)} className="text-xl font-extrabold">
            {r.name} <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-xs">i</span>
          </button>
          <p className="text-sm text-white/70">
            {mode === "routine" ? `${s.idx + 1} / ${s.total}세트` : "자유 모드"}
            {r.id === "lunge" && mode === "routine" && ` · ${s.lungeSide === 1 ? "첫 다리" : "반대 다리"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            camStop();
            s.stop();
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-xl bg-[#4a2630] px-3 font-bold text-[#ff6b6b]"
        >
          <span className="h-3.5 w-3.5 rounded-sm bg-[#ff4d4f]" /> 중단
        </button>
      </header>

      {/* 카메라 무대: 영상 비율 그대로 화면을 꽉 채우고, 뼈대·말풍선을 같은 좌표로 겹친다 */}
      <div className="relative flex-1 overflow-hidden" style={{ containerType: "size" }}>
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: `max(100cqw, calc(100cqh * ${aspect}))`,
            height: `max(100cqh, calc(100cqw / ${aspect}))`,
            transform: `translate(-50%, -50%)${mirrored ? " scaleX(-1)" : ""}`,
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 h-full w-full transition ${paused && camStatus === "ready" ? "brightness-50" : ""}`}
          />
          <SkeletonOverlay ref={skeletonRef} />
          {s.grade && (
            <div className="absolute" style={{ left: `${s.grade.x * 100}%`, top: `${s.grade.y * 100}%` }}>
              <div style={{ transform: mirrored ? "scaleX(-1)" : undefined }}>
                <GradeBubble key={s.grade.key} grade={s.grade.grade} />
              </div>
            </div>
          )}
        </div>

        {/* 파란 안내 띠 */}
        {s.banner && (
          <div key={s.banner.key} className="animate-pop absolute inset-x-3 top-3 z-10 rounded-2xl bg-[#2b8cff] px-4 py-3.5 text-center text-2xl font-extrabold text-white shadow-lg">
            {s.banner.text} {s.banner.text.includes("깊") || s.banner.text.includes("내려") ? "↓" : ""}
          </div>
        )}

        {camStatus === "ready" && paused && s.phase !== "rest" && <PauseOverlay />}

        {/* 레벨 업 */}
        {s.levelUp && (
          <div key={s.levelUp.key} className="animate-pop absolute bottom-4 left-3 z-10 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 font-bold text-foreground shadow-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            {s.levelUp.text}
          </div>
        )}

        {/* 3·2·1 */}
        {s.phase === "countdown" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
            <span key={s.countdown} className="animate-pop text-[10rem] font-extrabold text-white drop-shadow-lg">
              {s.countdown > 0 ? s.countdown : "시작!"}
            </span>
          </div>
        )}

        {/* 준비 단계 */}
        {s.phase === "ready" && (
          <ReadyPanel
            camStatus={camStatus}
            camError={camError ? CAMERA_ERROR_TEXT[camError] : null}
            modelStatus={model.status}
            armed={s.armed}
            paused={paused}
            progress={s.readyProgress}
            onCamera={camStart}
            onArm={s.arm}
            onRetryModel={model.retry}
            onFile={startFile}
            exercise={s.exercise}
          />
        )}

        {s.phase === "rest" && s.idx + 1 < order.length && (
          <RestScreen left={s.restLeft} next={order[s.idx + 1]} onSkip={s.skipRest} />
        )}

        {showInfo && (
          <div className="absolute inset-x-3 top-3 z-20 rounded-3xl bg-surface p-5 text-foreground shadow-xl">
            <p className="text-xl font-extrabold">
              {EXERCISE_INFO[s.exercise].emoji} {r.name} 방법
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {EXERCISE_INFO[s.exercise].howTo.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-muted">{r.placement}</p>
            <BigButton small variant="secondary" className="mt-3" onClick={() => setShowInfo(false)}>
              닫기
            </BigButton>
          </div>
        )}
      </div>

      {/* 아래 흰 카드 */}
      {(s.phase === "active" || s.phase === "countdown") && (
        <section className="z-10 -mt-4 rounded-t-3xl bg-surface px-5 pb-3 pt-4 text-center text-foreground">
          <p className="text-5xl font-extrabold tabular-nums">
            {isHold ? `유지 ${Math.floor(s.counts.holdSec)}초` : target ? `${s.counts.good} / ${target}회` : `${s.counts.good}회`}
            {isHold && target ? <span className="text-2xl text-muted"> / {target}초</span> : null}
          </p>
          {!isHold && <p className="mt-1 text-lg text-muted">얕은 횟수: {s.counts.shallow}</p>}
          <div className="mt-2 flex items-center justify-center gap-2">
            {mode === "routine" ? (
              order.map((id, i) => (
                <span key={id} className={`h-2 w-2 rounded-full ${i === s.idx ? "bg-foreground" : i < s.idx ? "bg-muted" : "bg-surface-2"}`} />
              ))
            ) : (
              <span className="text-sm text-muted">중단을 누르면 결과를 보여 줘요</span>
            )}
          </div>
          {mode === "routine" && (
            <button type="button" onClick={s.nextExercise} className="mt-1 text-sm text-muted underline underline-offset-2">
              다음 운동 ›
            </button>
          )}
        </section>
      )}
      <BottomTabs />
    </div>
  );
}

/** 관절 옆 "좋음!" / "얕음" 말풍선 */
function GradeBubble({ grade }: { grade: "good" | "shallow" }) {
  const good = grade === "good";
  return (
    <div className="animate-pop relative -translate-y-full">
      <div
        className={`flex h-[4.5rem] w-[4.5rem] -translate-x-1/2 items-center justify-center rounded-full border-4 border-white/90 text-xl font-extrabold text-white shadow-lg ${
          good ? "bg-[#3aa66b]" : "bg-[#d97b00]"
        }`}
      >
        {good ? "좋음!" : "얕음"}
      </div>
      <div
        className={`absolute -bottom-4 left-0 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white text-white ${
          good ? "bg-[#3aa66b]" : "bg-[#d97b00]"
        }`}
      >
        {good ? "✓" : "!"}
      </div>
    </div>
  );
}

function ReadyPanel(props: {
  camStatus: string;
  camError: { title: string; help: string } | null;
  modelStatus: string;
  armed: boolean;
  paused: boolean;
  progress: number;
  onCamera: () => void;
  onArm: () => void;
  onRetryModel: () => void;
  onFile: (f: File) => void;
  exercise: ExerciseId;
}) {
  const r = EXERCISE_RULES[props.exercise];
  const camOn = props.camStatus === "ready";
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 rounded-t-3xl bg-surface p-5 text-foreground">
      <p className="text-lg font-bold">
        {EXERCISE_INFO[props.exercise].emoji} {r.name} · {r.cameraView === "side" ? "측면" : "정면"}
      </p>
      <p className="text-muted">{r.placement}</p>
      {props.camError && (
        <div className="rounded-2xl border-2 border-danger p-3">
          <p className="font-bold">{props.camError.title}</p>
          <p className="text-sm text-muted">{props.camError.help}</p>
        </div>
      )}
      {props.modelStatus === "slow" && <p className="text-warn">준비하는 데 시간이 걸리고 있어요…</p>}
      {props.modelStatus === "error" && (
        <BigButton small variant="secondary" onClick={props.onRetryModel}>
          자세 인식 다시 준비하기
        </BigButton>
      )}
      {!camOn ? (
        <BigButton onClick={props.onCamera} disabled={props.camStatus === "starting"}>
          📷 카메라 켜기
        </BigButton>
      ) : !props.armed ? (
        <BigButton onClick={props.onArm}>🔊 소리 켜고 시작</BigButton>
      ) : (
        <div className="space-y-2">
          <p className="text-center text-lg font-bold">
            {props.paused ? "전신이 보이게 서 주세요" : "좋아요! 그대로 2초 유지하면 시작해요"}
          </p>
          <div className="h-3 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${props.progress * 100}%` }} />
          </div>
        </div>
      )}
      <DevVideoInput onFile={props.onFile} />
    </div>
  );
}
