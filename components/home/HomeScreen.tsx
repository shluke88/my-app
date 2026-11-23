"use client";

// Design Ref: §5.1 ① 첫 화면 — 캐릭터, 부위별 레벨, 기본 루틴, 운동 하나, 설정, 안내 문구
import Link from "next/link";
import BigButton from "@/components/common/BigButton";
import PageHeader from "@/components/common/PageHeader";
import SafetyNotice from "@/components/common/SafetyNotice";
import FirstUseNotice from "@/components/common/FirstUseNotice";
import PixelCharacter from "@/components/character/PixelCharacter";
import { useCharacter, useSettings } from "@/hooks/useStored";
import { EXERCISE_RULES, ROUTINE, SINGLE_ORDER } from "@/lib/exercise/rules";
import { BODY_PARTS, PART_LABEL } from "@/lib/growth/config";

export default function HomeScreen() {
  const { character } = useCharacter();
  const { settings, ready } = useSettings();

  return (
    <>
      <PageHeader
        title="PoseFit"
        right={
          <Link href="/settings" aria-label="설정" className="inline-flex min-h-11 items-center text-lg text-muted">
            ⚙설정
          </Link>
        }
      />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <Link href="/character" className="block rounded-3xl bg-surface p-3" aria-label="내 캐릭터 보기">
          <PixelCharacter character={character} size={176} className="mx-auto" />
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-sm">
            {BODY_PARTS.map((p) => (
              <div key={p} className="rounded-xl bg-surface-2 py-1">
                <div className="text-muted">{PART_LABEL[p]}</div>
                <div className="font-bold">Lv{character.parts[p].level}</div>
              </div>
            ))}
          </div>
        </Link>

        <div>
          <BigButton href="/workout?mode=routine">기본 루틴 시작 ▶</BigButton>
          <p className="mt-2 text-center text-sm text-muted">
            약 8~10분 · {ROUTINE.map((id) => EXERCISE_RULES[id].name).join(" → ")}
          </p>
        </div>

        <section>
          <h2 className="mb-2 text-lg font-bold">운동 하나만 하기</h2>
          <div className="grid grid-cols-3 gap-2">
            {SINGLE_ORDER.map((id) => (
              <BigButton key={id} href={`/workout?exercise=${id}`} variant="secondary" small>
                {EXERCISE_RULES[id].name}
              </BigButton>
            ))}
          </div>
        </section>

        <div className="mt-auto">
          <SafetyNotice />
        </div>
      </main>
      {ready && !settings.acknowledged && <FirstUseNotice />}
    </>
  );
}
