"use client";

// 결과 단계 (PLAN 작업 15·22): 시간, 반복 수(좋음), 얕은 반복, 플랭크 유지, 안내, 인식 중단, 부위별 경험치·레벨 변화, 새 아이템
import BigButton from "@/components/common/BigButton";
import PixelCharacter from "@/components/character/PixelCharacter";
import { useCharacter, useSettings } from "@/hooks/useStored";
import { BODY_PARTS, MAX_LEVEL, PART_LABEL, RARITY_LABEL } from "@/lib/growth/config";
import { xpToNext } from "@/lib/growth/level";
import { formatKcal, sessionKcal } from "@/lib/growth/calories";
import { ITEM_BY_ID, itemImage } from "@/lib/growth/items";
import Image from "next/image";
import Link from "next/link";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import type { BodyPart, SessionRecord } from "@/types";

const RARITY_BORDER = {
  normal: "border-rarity-normal",
  rare: "border-rarity-rare",
  epic: "border-rarity-epic",
  legend: "border-rarity-legend",
} as const;

/** 캐릭터 주변 반짝임 위치(%)와 각도 */
const SPARKS = [
  { x: -18, y: 18, r: -30 },
  { x: -24, y: 45, r: 0 },
  { x: -14, y: 72, r: 30 },
  { x: 104, y: 20, r: 30 },
  { x: 110, y: 46, r: 0 },
  { x: 100, y: 74, r: -30 },
];

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function ResultSummary({
  session,
  startLevels,
}: {
  session: SessionRecord;
  startLevels: Record<BodyPart, number>;
}) {
  const { character } = useCharacter();
  const { settings } = useSettings();
  const ex = session.exercises;
  const reps = ex.filter((e) => e.exercise !== "plank");
  const good = reps.reduce((a, e) => a + e.goodReps, 0);
  const shallow = reps.reduce((a, e) => a + e.shallowReps, 0);
  const hold = ex.find((e) => e.exercise === "plank")?.holdSec;
  const cues = ex.reduce((a, e) => a + e.cueCount, 0);
  const paused = ex.reduce((a, e) => a + e.pausedSec, 0);
  const totalKcal = sessionKcal(session);
  const weightKg = settings.weightKg;
  const xpBy = (p: BodyPart) =>
    ex.filter((e) => EXERCISE_RULES[e.exercise].bodyPart === p).reduce((a, e) => a + e.xpGained, 0);

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 pt-6">
      <h1 className="text-center text-3xl font-extrabold">운동 완료! 🎉</h1>
      {/* 캐릭터 뒤 은은한 빛과 주변 반짝임 */}
      <div className="relative mx-auto">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b8fd6]/30 blur-2xl" />
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="animate-twinkle pointer-events-none absolute h-1 w-4 rounded-full bg-[#9fc0ec]"
            style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `rotate(${s.r}deg)`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
        <PixelCharacter character={character} size={170} className="relative" />
      </div>
      {/* 소모 열량 (추정) + 운동별 열량 */}
      <section className="rounded-3xl bg-gradient-to-b from-light-card to-light-card-2 p-4 text-light-ink">
        <div className="flex items-baseline justify-between">
          <p className="font-bold opacity-75">🔥 소모 열량</p>
          <p className="text-xs opacity-60">{weightKg ? `몸무게 ${weightKg}kg 기준 추정` : "65kg 기준 추정"}</p>
        </div>
        <p className="text-4xl font-extrabold">
          약 {formatKcal(totalKcal)}
          <span className="ml-1 text-lg">kcal</span>
        </p>
        {ex.length > 1 && (
          <ul className="mt-2 grid grid-cols-2 gap-1.5 text-sm">
            {ex.map((e, i) => (
              <li key={i} className="flex justify-between rounded-full bg-white/60 px-3 py-1 font-bold">
                <span>{EXERCISE_RULES[e.exercise].name}</span>
                <span>{formatKcal(e.kcal ?? 0)} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid grid-cols-2 gap-2 text-center">
        <Stat label="시간" value={formatDuration(session.durationSec)} />
        <Stat label="반복(좋음)" value={`${good}회`} />
        <Stat label="얕은 반복" value={`${shallow}회`} />
        {hold !== undefined ? <Stat label="플랭크 유지" value={`${hold}초`} /> : <Stat label="안내" value={`${cues}번`} />}
        {hold !== undefined && <Stat label="안내" value={`${cues}번`} />}
        <Stat label="인식 중단" value={`${paused}초`} />
      </section>
      {/* 부위별: 이름 · 현재 레벨 진행 막대 · 얻은 경험치 · 레벨 */}
      <section className="space-y-2.5 rounded-3xl border border-line bg-surface p-4">
        {BODY_PARTS.map((p) => {
          const { level: now, xp } = character.parts[p];
          const up = now > startLevels[p];
          const max = now >= MAX_LEVEL;
          const ratio = max ? 1 : xp / xpToNext(now);
          return (
            <div key={p} className="flex items-center gap-3 text-base">
              <span className="w-10 font-bold">{PART_LABEL[p]}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-gradient-to-r from-primary-2 to-primary" style={{ width: `${Math.max(4, ratio * 100)}%` }} />
              </div>
              <span className="w-12 text-right text-muted">+{xpBy(p)}</span>
              <span className={`w-20 text-right ${up ? "font-extrabold text-accent" : "text-muted"}`}>
                {max ? "최대" : up ? `Lv${startLevels[p]}→${now} ⬆` : `Lv${now}`}
              </span>
            </div>
          );
        })}
      </section>
      {(session.ticketsEarned ?? 0) > 0 && (
        <Link
          href="/profile"
          className="animate-pop block rounded-2xl border-2 border-[#ffd75e] bg-surface p-3 text-center text-[#ffd75e]"
        >
          <span className="block text-lg font-extrabold">뽑기권 {session.ticketsEarned}장을 받았어요!</span>
          <span className="block text-sm text-muted">프로필에서 아이템을 뽑을 수 있어요 ›</span>
        </Link>
      )}
      {session.newItemIds.length > 0 && (
        <section className="space-y-2">
          {session.newItemIds.map((id) => {
            const it = ITEM_BY_ID[id];
            if (!it) return null;
            return (
              <div
                key={id}
                className={`animate-pop flex items-center gap-3 rounded-2xl border-4 bg-surface p-3 text-lg font-bold ${RARITY_BORDER[it.rarity]}`}
              >
                <Image
                  src={itemImage(it.id)}
                  alt=""
                  width={Math.round((56 * it.w) / it.h)}
                  height={56}
                  unoptimized
                  className="pixelated h-14 w-auto"
                />
                <span>
                  🎁 새 아이템: [{RARITY_LABEL[it.rarity]}] {it.name}
                </span>
              </div>
            );
          })}
        </section>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2">
        <BigButton href="/profile" variant="secondary" small>
          캐릭터 보기
        </BigButton>
        <BigButton href="/" small>
          처음으로
        </BigButton>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  );
}
