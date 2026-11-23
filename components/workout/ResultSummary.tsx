"use client";

// 결과 단계 (PLAN 작업 15·22): 시간, 반복 수(좋음), 얕은 반복, 플랭크 유지, 안내, 인식 중단, 부위별 경험치·레벨 변화, 새 아이템
import BigButton from "@/components/common/BigButton";
import PixelCharacter from "@/components/character/PixelCharacter";
import { useCharacter } from "@/hooks/useStored";
import { BODY_PARTS, MAX_LEVEL, PART_LABEL, RARITY_LABEL } from "@/lib/growth/config";
import { ITEM_BY_ID, itemImage } from "@/lib/growth/items";
import { EXERCISE_RULES } from "@/lib/exercise/rules";
import type { BodyPart, SessionRecord } from "@/types";

const RARITY_BORDER = {
  normal: "border-rarity-normal",
  rare: "border-rarity-rare",
  epic: "border-rarity-epic",
  legend: "border-rarity-legend",
} as const;

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
  const ex = session.exercises;
  const reps = ex.filter((e) => e.exercise !== "plank");
  const good = reps.reduce((a, e) => a + e.goodReps, 0);
  const shallow = reps.reduce((a, e) => a + e.shallowReps, 0);
  const hold = ex.find((e) => e.exercise === "plank")?.holdSec;
  const cues = ex.reduce((a, e) => a + e.cueCount, 0);
  const paused = ex.reduce((a, e) => a + e.pausedSec, 0);
  const xpBy = (p: BodyPart) =>
    ex.filter((e) => EXERCISE_RULES[e.exercise].bodyPart === p).reduce((a, e) => a + e.xpGained, 0);

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6 pt-6">
      <h1 className="text-center text-3xl font-extrabold">운동 완료! 🎉</h1>
      <PixelCharacter character={character} size={170} className="mx-auto" />
      <section className="grid grid-cols-2 gap-2 text-center">
        <Stat label="시간" value={formatDuration(session.durationSec)} />
        <Stat label="반복(좋음)" value={`${good}회`} />
        <Stat label="얕은 반복" value={`${shallow}회`} />
        {hold !== undefined ? <Stat label="플랭크 유지" value={`${hold}초`} /> : <Stat label="안내" value={`${cues}번`} />}
        {hold !== undefined && <Stat label="안내" value={`${cues}번`} />}
        <Stat label="인식 중단" value={`${paused}초`} />
      </section>
      <section className="space-y-2 rounded-3xl border border-line bg-surface p-4">
        {BODY_PARTS.map((p) => {
          const now = character.parts[p].level;
          const up = now > startLevels[p];
          return (
            <div key={p} className="flex items-center justify-between text-lg">
              <span className="font-bold">{PART_LABEL[p]}</span>
              <span className="text-muted">+{xpBy(p)}</span>
              <span className={up ? "font-extrabold text-accent" : ""}>
                {now >= MAX_LEVEL ? "최대 레벨" : up ? `Lv${startLevels[p]} → Lv${now} ⬆` : `Lv${now}`}
              </span>
            </div>
          );
        })}
      </section>
      {session.newItemIds.length > 0 && (
        <section className="space-y-2">
          {session.newItemIds.map((id) => {
            const it = ITEM_BY_ID[id];
            return (
              <div
                key={id}
                className={`animate-pop flex items-center gap-3 rounded-2xl border-4 bg-surface p-3 text-lg font-bold ${RARITY_BORDER[it.rarity]}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={itemImage(id)} alt="" className="pixelated h-14 w-14 object-contain" />
                <span>
                  🎁 새 아이템
                  <br />[{RARITY_LABEL[it.rarity]}] {it.name}
                </span>
              </div>
            );
          })}
        </section>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2">
        <BigButton href="/profile" variant="secondary" small>
          캐릭터 꾸미러 가기
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
