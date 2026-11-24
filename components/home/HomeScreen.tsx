"use client";

// Design Ref: §5.1 ① 첫 화면 — 캐릭터, 부위별 레벨, 기본 루틴, 운동 하나, 설정, 안내 문구
import Link from "next/link";
import BigButton from "@/components/common/BigButton";
import PageHeader from "@/components/common/PageHeader";
import SafetyNotice from "@/components/common/SafetyNotice";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import PixelCharacter from "@/components/character/PixelCharacter";
import { useCharacter, useSettings } from "@/hooks/useStored";
import BottomTabs from "@/components/common/BottomTabs";
import { EXERCISE_RULES, ROUTINE } from "@/lib/exercise/rules";
import { BODY_PARTS, PART_LABEL } from "@/lib/growth/config";

export default function HomeScreen() {
  const { character } = useCharacter();
  const { settings, ready } = useSettings();

  // 저장소를 읽기 전에는 아무것도 그리지 않아 첫 화면이 깜빡이지 않게 한다
  if (!ready) return <main className="min-h-dvh" />;
  // 처음 한 번: 동의 → 카메라 테스트 → 신체정보 → 루틴 시작
  if (!settings.onboarded) return <OnboardingFlow />;

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
        <Link href="/profile" className="block rounded-3xl border border-line bg-surface p-3 shadow-sm" aria-label="내 캐릭터 보기">
          <PixelCharacter character={character} size={220} className="mx-auto" />
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
            약 7~9분 ·{ROUTINE.map((id) => EXERCISE_RULES[id].name).join(" → ")}
          </p>
        </div>

        <BigButton href="/exercises" variant="secondary">
          운동 하나만 하기 ›
        </BigButton>

        <div className="mt-auto pt-2">
          <SafetyNotice />
        </div>
      </main>
      <BottomTabs />
    </>
  );
}
