"use client";

// 프로필: 캐릭터, 부위별 레벨 막대와 다음 레벨까지 남은 경험치, 모은 아이템, 신체정보, 설정
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import BottomTabs from "@/components/common/BottomTabs";
import PixelCharacter from "@/components/character/PixelCharacter";
import { useCharacter, useSettings } from "@/hooks/useStored";
import { BODY_PARTS, MAX_LEVEL, PART_LABEL, RARITY_LABEL } from "@/lib/growth/config";
import { xpToNext } from "@/lib/growth/level";
import { ITEMS, SLOT_LABEL } from "@/lib/growth/items";

const RARITY_TEXT = {
  normal: "text-rarity-normal",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legend: "text-rarity-legend",
} as const;

export default function ProfileScreen() {
  const { character, ready } = useCharacter();
  const { settings } = useSettings();
  const owned = new Set(character.unlockedItemIds);

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
          <PixelCharacter character={character} size={160} className="mx-auto" />
          {ready && (settings.heightCm || settings.weightKg) && (
            <p className="mt-2 text-center text-sm text-muted">
              {settings.heightCm ? `키 ${settings.heightCm}cm` : ""} {settings.weightKg ? `· 몸무게 ${settings.weightKg}kg` : ""}
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

        <section className="rounded-3xl border border-line bg-surface p-4">
          <h2 className="mb-2 text-lg font-bold">
            모은 아이템 {owned.size} / {ITEMS.length}
          </h2>
          {owned.size === 0 ? (
            <p className="text-muted">아무 부위나 4레벨이 되면 첫 아이템을 받아요.</p>
          ) : (
            <ul className="space-y-1">
              {ITEMS.filter((i) => owned.has(i.id)).map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>
                    {SLOT_LABEL[i.slot]} · {i.name}
                  </span>
                  <span className={`font-bold ${RARITY_TEXT[i.rarity]}`}>{RARITY_LABEL[i.rarity]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <BottomTabs />
    </>
  );
}
