"use client";

// Design Ref: §2.2 — 루틴·운동 하나 진행, 판정, 안내, 경험치·레벨·아이템, 결과 집계·저장 (PLAN 작업 12~16, 20, 22, 27, 28)
// 매 장면 처리는 ref에 담긴 값으로 하고, 화면에 보일 것만 state로 올려 다시 그린다.
import { useCallback, useEffect, useRef, useState } from "react";
import type { PoseFrame } from "./usePoseLoop";
import { createJudge, type Judge } from "@/lib/exercise/judges";
import { CueFilter } from "@/lib/exercise/cueFilter";
import {
  COUNTDOWN_SEC,
  CUE_BANNER_SEC,
  EXERCISE_RULES,
  GRADE_SHOW_SEC,
  LUNGE_SWITCH_TEXT,
  READY_HOLD_SEC,
  REST_SEC,
  ROUTINE,
} from "@/lib/exercise/rules";
import { ConfidenceGate } from "@/lib/pose/confidence";
import { minVisibility, pickSide, toPose } from "@/lib/pose/landmarks";
import { applyXp } from "@/lib/growth/progress";
import { estimateKcal } from "@/lib/growth/calories";
import { PART_LABEL } from "@/lib/growth/config";
import { addSession, loadCharacter, loadSettings, saveCharacter } from "@/lib/storage/localStore";
import { speak, stopSpeech, unlockSpeech } from "@/lib/voice/speech";
import type { BodyPart, ExerciseId, ExerciseResult, SessionRecord } from "@/types";

export type Phase = "ready" | "countdown" | "active" | "rest" | "result";

interface Current {
  good: number;
  shallow: number;
  holdSec: number;
  cueCount: number;
  xp: number;
  /** 런지 루틴: 1 = 첫 다리, 2 = 반대 다리 */
  lungeSide: 1 | 2;
  sideGood: number;
  pausedBase: number;
  /** 실제로 운동한 시간(초): 운동 단계에서 인식이 좋을 때만 쌓인다 (열량 추정용) */
  activeSec: number;
  lastActiveT: number | null;
}

const emptyCurrent = (): Current => ({
  good: 0,
  shallow: 0,
  holdSec: 0,
  cueCount: 0,
  xp: 0,
  lungeSide: 1,
  sideGood: 0,
  pausedBase: 0,
  activeSec: 0,
  lastActiveT: null,
});

/** 운동 중 레벨업 알림 */
export interface LevelUpInfo {
  part: string;
  level: number;
  /** 이번 레벨업으로 받은 뽑기권 수 */
  tickets: number;
  key: number;
}

export interface Toast {
  text: string;
  key: number;
}
export interface GradeMark {
  grade: "good" | "shallow";
  /** 화면 비율 좌표(거울 반전 전) */
  x: number;
  y: number;
  key: number;
}

export function useWorkoutSession(order: ExerciseId[], mode: "routine" | "single") {
  const [idx, setIdx] = useState(0);
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [armed, setArmed] = useState(false);
  const [paused, setPaused] = useState(true);
  const [counts, setCounts] = useState({ good: 0, shallow: 0, holdSec: 0 });
  const [banner, setBanner] = useState<Toast | null>(null);
  const [grade, setGrade] = useState<GradeMark | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
  const [restLeft, setRestLeft] = useState(REST_SEC);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [readyProgress, setReadyProgress] = useState(0);
  const [side, setSide] = useState<"L" | "R" | undefined>(undefined);
  const [hint, setHint] = useState<string | undefined>(undefined);
  const [debug, setDebug] = useState<string | undefined>(undefined);
  const [lungeSide, setLungeSide] = useState<1 | 2>(1);
  const [startLevels] = useState<Record<BodyPart, number>>(() => {
    const c = loadCharacter();
    return { lower: c.parts.lower.level, upper: c.parts.upper.level, core: c.parts.core.level, stamina: c.parts.stamina.level };
  });
  const [startedAt] = useState(() => Date.now());
  const [savedSession, setSavedSession] = useState<SessionRecord | null>(null);

  const exercise = order[idx];
  const rule = EXERCISE_RULES[exercise];

  const phaseRef = useRef<Phase>("ready");
  const armedRef = useRef(false);
  const judgeRef = useRef<Judge>(createJudge(exercise));
  const cueRef = useRef(new CueFilter(rule.cues));
  const gateRef = useRef(new ConfidenceGate());
  const curRef = useRef<Current>(emptyCurrent());
  const goodSinceRef = useRef<number | null>(null);
  const lastTRef = useRef(0);
  const keyRef = useRef(1);
  const resultsRef = useRef<ExerciseResult[]>([]);
  const newItemsRef = useRef<string[]>([]);
  /** 이 세션에서 받은 뽑기권 수 */
  const ticketsRef = useRef(0);
  const voiceOnRef = useRef(true);
  const idxRef = useRef(0);

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const nextKey = () => keyRef.current++;

  const say = useCallback((text: string) => {
    if (voiceOnRef.current) speak(text);
  }, []);

  /** 경험치를 넣고 바로 저장한다. 레벨업하면 크게 알리고, 해금 레벨이면 뽑기권을 준다 */
  const gainXp = useCallback(
    (part: BodyPart, amount: number) => {
      if (amount <= 0) return;
      const { character, result: r, ticketsAdded } = applyXp(loadCharacter(), part, amount);
      saveCharacter(character);
      curRef.current.xp += r.gained;
      if (ticketsAdded > 0) ticketsRef.current += ticketsAdded;
      if (r.reachedLevels.length) {
        setLevelUp({ part: PART_LABEL[part], level: r.next.level, tickets: ticketsAdded, key: nextKey() });
        say(`${PART_LABEL[part]} 레벨 ${r.next.level}`);
      }
    },
    [say],
  );

  const showCue = useCallback(
    (text: string, voice: boolean) => {
      curRef.current.cueCount += 1;
      setBanner({ text, key: nextKey() });
      if (voice) say(text);
    },
    [say],
  );

  /** 지금 운동의 결과를 만든다 */
  const snapshotResult = useCallback((): ExerciseResult => {
    const c = curRef.current;
    const pausedSec = gateRef.current.pausedSec(lastTRef.current) - c.pausedBase;
    const r = EXERCISE_RULES[order[idxRef.current]];
    return {
      exercise: r.id,
      goodReps: c.good,
      shallowReps: c.shallow,
      holdSec: r.measure === "hold" ? Math.round(c.holdSec) : undefined,
      cueCount: c.cueCount,
      pausedSec: Math.max(0, Math.round(pausedSec)),
      xpGained: c.xp,
      activeSec: Math.round(c.activeSec),
      kcal: Math.round(estimateKcal(r.id, c.activeSec, loadSettings().weightKg) * 10) / 10,
    };
  }, [order]);

  /** 세션 결과를 저장하고 결과 화면으로 */
  const finishSession = useCallback(() => {
    if (phaseRef.current === "result") return;
    const started = phaseRef.current !== "ready" || curRef.current.good + curRef.current.shallow > 0;
    if (started) resultsRef.current = [...resultsRef.current, snapshotResult()];
    stopSpeech();
    const record: SessionRecord = {
      id: `s-${startedAt}`,
      startedAt: new Date(startedAt).toISOString(),
      mode,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      exercises: resultsRef.current,
      newItemIds: newItemsRef.current,
      ticketsEarned: ticketsRef.current,
    };
    if (record.exercises.length) addSession(record);
    setResults(resultsRef.current);
    setSavedSession(record);
    setPhase("result");
  }, [mode, setPhase, snapshotResult, startedAt]);

  /** 다음 운동 준비 (판정기·필터·카운트 초기화) */
  const prepareExercise = useCallback(
    (i: number) => {
      const id = order[i];
      idxRef.current = i;
      setIdx(i);
      judgeRef.current = createJudge(id);
      cueRef.current = new CueFilter(EXERCISE_RULES[id].cues);
      curRef.current = { ...emptyCurrent(), pausedBase: gateRef.current.pausedSec(lastTRef.current) };
      goodSinceRef.current = null;
      setCounts({ good: 0, shallow: 0, holdSec: 0 });
      setReadyProgress(0);
      setLungeSide(1);
      setPhase("ready");
    },
    [order, setPhase],
  );

  /** 지금 운동을 끝낸다: 루틴이면 쉬기, 마지막이면 결과 */
  const finishExercise = useCallback(() => {
    if (mode === "routine" && idxRef.current < order.length - 1) {
      resultsRef.current = [...resultsRef.current, snapshotResult()];
      setResults(resultsRef.current);
      say(`잘했어요. ${REST_SEC}초 쉬어요`);
      setRestLeft(REST_SEC);
      setPhase("rest");
    } else {
      finishSession();
    }
  }, [finishSession, mode, order.length, say, setPhase, snapshotResult]);

  /** 목표 달성 여부 (루틴만) */
  const checkTarget = useCallback(() => {
    if (mode !== "routine") return;
    const r = EXERCISE_RULES[order[idxRef.current]];
    const c = curRef.current;
    if (r.id === "lunge") {
      if (c.sideGood >= r.routineTarget) {
        if (c.lungeSide === 1) {
          c.lungeSide = 2;
          c.sideGood = 0;
          setLungeSide(2);
          setBanner({ text: LUNGE_SWITCH_TEXT, key: nextKey() });
          say(LUNGE_SWITCH_TEXT);
        } else finishExercise();
      }
    } else if (r.measure === "hold" ? c.holdSec >= r.routineTarget : c.good >= r.routineTarget) {
      finishExercise();
    }
  }, [finishExercise, mode, order, say]);

  /** "소리 켜고 시작": 휴대폰 음성을 깨우고 자동 시작을 켠다 */
  const arm = useCallback(() => {
    voiceOnRef.current = loadSettings().voiceOn;
    if (voiceOnRef.current) {
      unlockSpeech();
      speak("좋아요. 전신이 보이게 서 주세요");
    }
    armedRef.current = true;
    setArmed(true);
  }, []);

  /** 매 장면 */
  const onFrame = useCallback(
    (f: PoseFrame) => {
      lastTRef.current = f.t;
      const p = phaseRef.current;
      if (p === "result" || p === "rest") return;
      const r = EXERCISE_RULES[order[idxRef.current]];
      const pose = f.landmarks ? toPose(f.landmarks) : null;
      const s = pose && r.cameraView === "side" ? pickSide(pose, r.requiredLandmarks) : undefined;
      const minVis = pose ? minVisibility(pose, r.requiredLandmarks, s ?? "L") : 0;
      const ev = gateRef.current.update(minVis, f.t);
      if (ev) setPaused(ev === "pause");
      if (s) setSide((old) => (old === s ? old : s));

      if (ev === "pause") {
        curRef.current.lastActiveT = null; // 인식이 끊긴 동안은 운동 시간에 넣지 않는다
        // 진행 중 반복은 버린다 (경험치 없음)
        judgeRef.current.reset();
        cueRef.current.reset();
        goodSinceRef.current = null;
        setReadyProgress(0);
      }
      if (!pose || gateRef.current.paused) return;

      if (p === "ready") {
        if (!armedRef.current) return;
        if (goodSinceRef.current === null) goodSinceRef.current = f.t;
        const held = f.t - goodSinceRef.current;
        setReadyProgress(Math.min(1, held / READY_HOLD_SEC));
        if (held >= READY_HOLD_SEC) {
          say("인식되었습니다");
          setCountdown(COUNTDOWN_SEC);
          setPhase("countdown");
        }
        return;
      }
      if (p !== "active") return;

      // 실제 운동 시간 누적 (프레임 사이 간격, 너무 긴 간격은 0.5초로 자름)
      {
        const cur = curRef.current;
        if (cur.lastActiveT !== null) cur.activeSec += Math.min(0.5, Math.max(0, f.t - cur.lastActiveT));
        cur.lastActiveT = f.t;
      }

      const out = judgeRef.current.update(pose, f.aspect, f.t);
      // 세지 않는 이유와 개발용 측정값 (바뀔 때만 다시 그림)
      setHint((old) => (old === out.hint ? old : out.hint));
      if (process.env.NODE_ENV === "development") setDebug((old) => (old === out.debug ? old : out.debug));
      const c = curRef.current;

      // 자세형 안내 (0.5초 지속)
      const posture = cueRef.current.updatePosture(out.postureCueIds, f.t);
      if (posture) showCue(posture.cue.text, posture.speak);

      if (out.rep) {
        const g = out.rep.grade;
        if (g === "good") {
          c.good += 1;
          c.sideGood += 1;
          gainXp(r.bodyPart, r.xpPerUnit);
        } else {
          c.shallow += 1;
          gainXp(r.bodyPart, r.xpShallow);
        }
        if (out.focus) setGrade({ grade: g, x: out.focus.x, y: out.focus.y, key: nextKey() });
        const range = cueRef.current.endRep(out.rangeCueIds, f.t);
        if (range) showCue(range.cue.text, range.speak);
        else if (g === "good") {
          // 남은 횟수 음성: 루틴은 "N회 남았어요"(5회마다, 마지막 3회는 매번), 자유 모드는 5회마다 누적 횟수
          if (mode === "routine") {
            const done = r.id === "lunge" ? c.sideGood : c.good;
            const left = r.routineTarget - done;
            if (left > 0 && (left <= 3 || done % 5 === 0)) say(`${left}회 남았어요`);
          } else if (c.good % 5 === 0) say(`${c.good}회`);
        }
        setCounts({ good: c.good, shallow: c.shallow, holdSec: c.holdSec });
        checkTarget();
      }

      if (out.holdSec !== undefined) {
        c.holdSec = out.holdSec;
        if (out.newHoldUnits && out.newHoldUnits > 0) {
          c.good += out.newHoldUnits;
          gainXp(r.bodyPart, r.xpPerUnit * out.newHoldUnits);
          if (out.focus) setGrade({ grade: "good", x: out.focus.x, y: out.focus.y, key: nextKey() });
          cueRef.current.nextUnit();
          // 플랭크 남은 시간 음성 (5초마다)
          if (mode === "routine") {
            const left = r.routineTarget - Math.floor(c.holdSec);
            if (left > 0) say(`${left}초 남았어요`);
          } else say(`${Math.floor(c.holdSec)}초`);
        }
        setCounts((old) =>
          Math.floor(old.holdSec) === Math.floor(c.holdSec) && old.good === c.good
            ? old
            : { good: c.good, shallow: 0, holdSec: c.holdSec },
        );
        checkTarget();
      }

      // 플랭크: 기준 자세를 잡은 뒤 자세가 2초 넘게 무너지면 끝 (루틴은 다음 운동, 운동 하나는 결과 화면)
      if (out.ended && phaseRef.current === "active") {
        finishExercise();
        say("자세가 무너져서 플랭크를 마칠게요");
      }
    },
    [checkTarget, finishExercise, gainXp, mode, order, say, setPhase, showCue],
  );

  // 3·2·1 카운트다운
  useEffect(() => {
    if (phase !== "countdown") return;
    if (voiceOnRef.current) speak(String(countdown));
    const t = window.setTimeout(() => {
      if (countdown <= 1) {
        say("시작");
        setPhase("active");
      } else setCountdown(countdown - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [phase, countdown, say, setPhase]);

  // 쉬기(REST_SEC초) → 끝나면 다음 운동 준비 (자동 시작)
  useEffect(() => {
    if (phase !== "rest") return;
    const t = window.setTimeout(() => {
      if (restLeft <= 1) prepareExercise(idxRef.current + 1);
      else setRestLeft(restLeft - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [phase, restLeft, prepareExercise]);

  // 안내 띠 2초, 등급 1.2초, 레벨 업 2.5초 뒤 사라짐
  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), CUE_BANNER_SEC * 1000);
    return () => window.clearTimeout(t);
  }, [banner]);
  useEffect(() => {
    if (!grade) return;
    const t = window.setTimeout(() => setGrade(null), GRADE_SHOW_SEC * 1000);
    return () => window.clearTimeout(t);
  }, [grade]);
  useEffect(() => {
    if (!levelUp) return;
    const t = window.setTimeout(() => setLevelUp(null), 3000);
    return () => window.clearTimeout(t);
  }, [levelUp]);

  // 운동 중 화면 꺼짐 방지 (지원하지 않으면 그냥 넘어감)
  useEffect(() => {
    if (phase === "result") return;
    let lock: WakeLockSentinel | null = null;
    let released = false;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => {
        if (released) void l.release();
        else lock = l;
      })
      .catch(() => {});
    return () => {
      released = true;
      void lock?.release();
    };
  }, [phase]);

  return {
    exercise,
    rule,
    idx,
    total: order.length,
    phase,
    armed,
    paused,
    counts,
    banner,
    grade,
    levelUp,
    countdown,
    restLeft,
    results,
    readyProgress,
    side,
    startLevels,
    savedSession,
    lungeSide,
    hint,
    debug,
    arm,
    onFrame,
    stop: finishSession,
    skipRest: () => prepareExercise(idxRef.current + 1),
    nextExercise: finishExercise,
    demo,
  };

  /** 개발 모드 전용 미리보기: 카메라 없이 운동 중 화면(횟수·안내 띠·좋음 말풍선·레벨 업)을 보여 준다 */
  function demo() {
    // 중단을 눌러 결과 화면이면 미리보기를 멈춘다
    if (phaseRef.current === "result" || phaseRef.current === "rest") return;
    phaseRef.current = "active";
    setPhaseState("active");
    setPaused(false);
    setCounts({ good: 7, shallow: 0, holdSec: 12 });
    curRef.current.good = 7;
    curRef.current.activeSec = 95; // 결과 화면 열량 미리보기용
    const text = EXERCISE_RULES[order[idxRef.current]].cues[0]?.text ?? "";
    setBanner({ text, key: nextKey() });
    setGrade({ grade: "good", x: 0.52, y: 0.55, key: nextKey() });
    setLevelUp({ part: PART_LABEL[EXERCISE_RULES[order[idxRef.current]].bodyPart], level: 4, tickets: 1, key: nextKey() });
  }
}

export function orderFor(mode: "routine" | "single", exercise: ExerciseId): ExerciseId[] {
  return mode === "routine" ? ROUTINE : [exercise];
}
