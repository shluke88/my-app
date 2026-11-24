"use client";

// 기록: 이 기기에 저장된 최근 세션 30개 (브라우저에만 저장)
import { useSyncExternalStore } from "react";
import PageHeader from "@/components/common/PageHeader";
import BottomTabs from "@/components/common/BottomTabs";
import { formatDuration } from "@/components/workout/ResultSummary";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import { loadSessions, readRaw, STORE_EVENT, STORE_KEYS } from "@/lib/storage/localStore";

function subscribe(cb: () => void) {
  window.addEventListener(STORE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(STORE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export default function HistoryScreen() {
  // 원본 글자가 바뀔 때만 다시 읽는다
  const raw = useSyncExternalStore(subscribe, () => readRaw(STORE_KEYS.sessions), () => undefined);
  const sessions = raw === undefined ? [] : loadSessions();

  return (
    <>
      <PageHeader title="기록" />
      <main className="flex flex-1 flex-col gap-3 px-4 pb-6">
        {raw !== undefined && sessions.length === 0 && (
          <p className="mt-10 text-center text-muted">아직 운동 기록이 없어요. 첫 루틴을 시작해 보세요!</p>
        )}
        {sessions.map((s) => {
          const d = new Date(s.startedAt);
          const good = s.exercises.filter((e) => e.exercise !== "plank").reduce((a, e) => a + e.goodReps, 0);
          const xp = s.exercises.reduce((a, e) => a + e.xpGained, 0);
          return (
            <article key={s.id} className="rounded-3xl bg-gradient-to-b from-light-card to-light-card-2 p-4 text-light-ink shadow-lg shadow-black/30">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold">{s.mode === "routine" ? "기본 루틴" : EXERCISE_RULES[s.exercises[0]?.exercise ?? "squat"].name}</h2>
                <span className="text-sm text-light-ink/70">
                  {d.getMonth() + 1}/{d.getDate()} {String(d.getHours()).padStart(2, "0")}:{String(d.getMinutes()).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-1 text-light-ink/80">
                {formatDuration(s.durationSec)} · 반복 {good}회 · 경험치 +{xp}
                {s.newItemIds.length > 0 && ` · 🎁 ${s.newItemIds.length}개`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.exercises.map((e, i) => (
                  <span key={i} className="rounded-full bg-white/60 px-2.5 py-1 text-sm font-bold text-light-ink">
                    {EXERCISE_RULES[e.exercise].name} {e.exercise === "plank" ? `${e.holdSec ?? 0}초` : `${e.goodReps}회`}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </main>
      <BottomTabs />
    </>
  );
}
