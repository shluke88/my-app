"use client";

// 프로필: 캐릭터, 부위별 레벨 막대와 다음 레벨까지 남은 경험치, 모은 아이템, 신체정보, 설정
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import BottomTabs from "@/components/common/BottomTabs";
import PixelCharacter from "@/components/character/PixelCharacter";
import { useCharacter, useSettings } from "@/hooks/useStored";
import { BODY_PARTS, MAX_LEVEL, PART_LABEL } from "@/lib/growth/config";
import { xpToNext } from "@/lib/growth/level";
import Wardrobe from "@/components/character/Wardrobe";

export default function ProfileScreen() {
  const { character, ready } = useCharacter();
  const { settings } = useSettings();

  return (
    <>
      <PageHeader
        title="프로필"
        right={
          <Link href="/settings" className="inline-flex min-h-11 items-center text-lg text-muted">
            ⚙설정
          </Link>
        }
      />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-6">
        <div className="rounded-3xl border border-line bg-surface p-4 shadow-sm">
          <PixelCharacter character={character} size={200} className="mx-auto" />
          {ready && (settings.gender || settings.heightCm || settings.weightKg) && (
            <p className="mt-2 text-center text-sm text-muted">
              {[settings.gender && (settings.gender === "male" ? "남성" : "여성"), settings.heightCm && `키 ${settings.heightCm}cm`, settings.weightKg && `몸무게 ${settings.weightKg}kg`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>

        <section className="space-y-3 rounded-3xl border border-line bg-surface p-4">
          {BODY_PARTS.map((p) => {
            const { level, xp } = character.parts[p];
            const max = level >= MAX_LEVEL;
            const need = xpToNext(level);
            return (
              <div key={p}>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold">
                    {PART_LABEL[p]} Lv{level}
                  </span>
                  <span className="text-sm text-muted">{max ? "최대 레벨" : `다음까지 ${need - xp}`}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-primary" style={{ width: max ? "100%" : `${(xp / need) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </section>

        <Wardrobe character={character} />
      </main>
      <BottomTabs />
    </>
  );
}
