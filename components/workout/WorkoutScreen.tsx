"use client";

// ② 운동 화면 — 사용자가 준 그림처럼: 어두운 위 막대(뒤로·운동 이름·세트·중단), 화면을 꽉 채운 카메라와 뼈대,
// 위쪽 파란 안내 띠, 관절 옆 "좋음!" 말풍선, 왼쪽 아래 "레벨 업!", 아래 흰 카드(반복 수/목표·얕은 횟수·진행 점), 하단 탭.
// 단계: 카메라 점검(자동으로 카메라 켜기 → 인식되면 테두리 초록 → "인식되었습니다" → 3·2·1) → 운동 → (루틴) 쉬기 → 결과
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const { arm } = s;

  // 운동 화면에 들어오면 바로 카메라를 켜고 점검을 시작한다 (시작 버튼을 누른 직후라 카메라·소리 허용이 가능)
  useEffect(() => {
    void camStart();
    arm();
  }, [camStart, arm]);

  const checking = s.phase === "ready" || s.phase === "countdown";

  // 개발 모드 전용: 주소 끝에 &demo=1을 붙이면 카메라 없이 운동 중 화면을 미리 본다
  const demoOn = process.env.NODE_ENV === "development" && params.get("demo") === "1";
  const demoRef = useRef(s.demo);
  useEffect(() => {
    demoRef.current = s.demo;
  });
  useEffect(() => {
    if (!demoOn) return;
    const run = () => demoRef.current();
    const first = window.setTimeout(run, 300);
    const loop = window.setInterval(run, 3000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, [demoOn]);

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
    <div className="flex h-dvh flex-col bg-[#111827]">
      {/* 위 막대 */}
      <header className="z-30 flex items-center gap-2 bg-[#1d2539] px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-white">
        <Link href="/" className="flex min-h-11 items-center gap-1 text-lg font-bold" onClick={() => camStop()}>
          <span className="text-2xl">‹</span> PoseFit
        </Link>
        <div className="flex-1 text-center">
          {checking ? (
            // 카메라 점검 중에는 운동 이름·세트를 숨기고 단순한 카메라 테스트 화면으로 보여 준다
            <p className="text-xl font-extrabold">카메라 테스트</p>
          ) : (
            <>
              <button type="button" onClick={() => setShowInfo((v) => !v)} className="text-xl font-extrabold">
                {r.name}{" "}
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-xs">i</span>
              </button>
              <p className="text-sm text-white/70">
                {mode === "routine" ? `${s.idx + 1} / ${s.total}세트` : "자유 모드"}
                {r.id === "lunge" && mode === "routine" && ` · ${s.lungeSide === 1 ? "첫 다리" : "반대 다리"}`}
              </p>
            </>
          )}
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

        {/* 개발 모드 전용: 실시간 측정값 (기준값 조정용, 배포된 앱에는 안 보임) */}
        {process.env.NODE_ENV === "development" && s.phase === "active" && s.debug && (
          <p className="absolute left-2 top-24 z-10 max-w-[90%] rounded-lg bg-black/60 px-2 py-1 font-mono text-xs text-white">
            🛠 {s.debug}
          </p>
        )}

        {/* 파란 안내 띠 */}
        {s.banner && (
          <div key={s.banner.key} className="animate-pop absolute inset-x-3 top-3 z-10 rounded-2xl bg-[#2b8cff] px-4 py-3.5 text-center text-2xl font-extrabold text-white shadow-lg">
            {s.banner.text} {s.banner.text.includes("깊") || s.banner.text.includes("내려") ? "↓" : ""}
          </div>
        )}

        {camStatus === "ready" && paused && s.phase === "active" && <PauseOverlay />}

        {/* 카메라 점검 테두리: 인식되면 초록, 아니면 흰색 */}
        {checking && camStatus === "ready" && (
          <div
            className={`pointer-events-none absolute inset-0 z-[5] border-[6px] transition-colors duration-300 ${
              paused ? "border-white/50" : "border-[#4ade80]"
            }`}
          />
        )}

        {/* 레벨 업 */}
        {s.levelUp && (
          <div key={s.levelUp.key} className={`animate-pop absolute left-3 z-20 flex items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-2.5 font-bold text-foreground shadow-lg ${s.phase === "active" ? "bottom-[10.5rem]" : "bottom-4"}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            {s.levelUp.text}
          </div>
        )}

        {/* 3·2·1 */}
        {s.phase === "countdown" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/30">
            <p className="animate-pop rounded-full bg-[#3aa66b] px-5 py-2 text-2xl font-extrabold text-white shadow-lg">✓ 인식되었습니다</p>
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
            paused={paused}
            progress={s.readyProgress}
            onCamera={camStart}
            onRetryModel={model.retry}
            onFile={startFile}
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
        {/* 아래 흰 카드 (그림처럼 카메라 위에 떠 있는 둥근 카드): 반복 수/목표, 얕은 횟수, 몇 번째 운동인지 점 */}
        {(s.phase === "active" || s.phase === "countdown") && (
          <section className="absolute inset-x-3 bottom-3 z-10 rounded-3xl bg-surface px-5 pb-3 pt-4 text-center text-foreground shadow-xl">
            <p className="text-5xl font-extrabold tabular-nums">
              {isHold
                ? target
                  ? `${Math.floor(s.counts.holdSec)} / ${target}초`
                  : `유지 ${Math.floor(s.counts.holdSec)}초`
                : target
                  ? `${s.counts.good} / ${target}회`
                  : `${s.counts.good}회`}
            </p>
            {s.phase === "active" && s.hint ? (
              // 지금 세지 않는 이유 (예: 옆모습이 아님, 일직선이 아님)
              <p className="mt-1 text-base font-bold text-warn">{s.hint}</p>
            ) : (
              <p className="mt-1 text-lg text-muted">
                {isHold ? "기준 자세로 버틴 시간" : `얕은 횟수: ${s.counts.shallow}`}
              </p>
            )}
            <div className="mt-2 flex items-center justify-center gap-2">
              {mode === "routine" ? (
                order.map((id, i) => (
                  <span
                    key={id}
                    className={`h-2 w-2 rounded-full ${i === s.idx ? "bg-foreground" : i < s.idx ? "bg-muted" : "bg-surface-2"}`}
                  />
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
      </div>
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

/** 카메라 점검 패널: 카메라는 자동으로 켜지고, 전신이 인식되면 2초 뒤 자동으로 시작한다 */
function ReadyPanel(props: {
  camStatus: string;
  camError: { title: string; help: string } | null;
  modelStatus: string;
  paused: boolean;
  progress: number;
  onCamera: () => void;
  onRetryModel: () => void;
  onFile: (f: File) => void;
}) {
  const camOn = props.camStatus === "ready";
  const modelReady = props.modelStatus === "ready";
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 rounded-t-3xl bg-surface p-5 text-foreground">
      <div className="flex items-baseline justify-between">
        <p className="text-xl font-extrabold">카메라 테스트</p>
      </div>
      <p className="text-muted">휴대폰을 세워 두고 1~3m 뒤로 서서, 머리부터 발끝까지 화면에 보이게 해 주세요.</p>
      {props.camError && (
        <div className="rounded-2xl border-2 border-danger p-3">
          <p className="font-bold">{props.camError.title}</p>
          <p className="text-sm text-muted">{props.camError.help}</p>
        </div>
      )}
      {props.modelStatus === "slow" && <p className="text-warn">자세 인식을 준비하는 데 시간이 걸리고 있어요…</p>}
      {props.modelStatus === "error" && (
        <BigButton small variant="secondary" onClick={props.onRetryModel}>
          자세 인식 다시 준비하기
        </BigButton>
      )}
      {!camOn ? (
        props.camStatus === "error" ? (
          <BigButton onClick={props.onCamera}>📷 카메라 다시 켜기</BigButton>
        ) : (
          <p className="text-center text-lg font-bold">카메라를 켜는 중…</p>
        )
      ) : !modelReady ? (
        <p className="text-center text-lg font-bold">자세 인식을 준비하는 중…</p>
      ) : (
        <div className="space-y-2">
          <p className={`text-center text-lg font-bold ${props.paused ? "" : "text-accent"}`}>
            {props.paused ? "전신이 보이게 서 주세요" : "✓ 인식되었습니다 — 그대로 잠시만요"}
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