"use client";

// 아이템 선반: 종류 탭 4개(덤벨·케틀벨·밴드·매트), 등급 테두리, 잠긴 아이템은 자물쇠.
// 모은 아이템을 누르면 캐릭터 옆에 놓고, 다시 누르면 치운다. 종류마다 하나만 놓을 수 있다.
import Image from "next/image";
import { useState } from "react";
import { RARITY_LABEL } from "@/lib/growth/config";
import { ITEMS, SLOT_LABEL, SLOT_ORDER, itemImage } from "@/lib/growth/items";
import { loadCharacter, saveCharacter } from "@/lib/storage/localStore";
import type { CharacterState, ItemDef, ItemSlot } from "@/types";

const RARITY_BORDER = {
  normal: "border-rarity-normal",
  rare: "border-rarity-rare",
  epic: "border-rarity-epic",
  legend: "border-rarity-legend",
} as const;

export default function ItemShelf({ character }: { character: CharacterState }) {
  const [slot, setSlot] = useState<ItemSlot>("dumbbell");
  const owned = new Set(character.unlockedItemIds);

  const toggle = (it: ItemDef) => {
    if (!owned.has(it.id)) return;
    const ch = loadCharacter();
    if (ch.equipped[it.slot] === it.id) delete ch.equipped[it.slot];
    else ch.equipped[it.slot] = it.id;
    saveCharacter(ch);
  };

  return (
    <section className="rounded-3xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">내 아이템</h2>
        <span className="text-sm text-muted">
          모은 아이템 {owned.size} / {ITEMS.length}
        </span>
      </div>
      <div role="tablist" className="mb-3 grid grid-cols-4 gap-1 rounded-2xl bg-surface-2 p-1">
        {SLOT_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={slot === s}
            onClick={() => setSlot(s)}
            className={`min-h-10 rounded-xl text-sm font-bold transition ${slot === s ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            {SLOT_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ITEMS.filter((it) => it.slot === slot).map((it) => {
          const has = owned.has(it.id);
          const on = character.equipped[it.slot] === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => toggle(it)}
              disabled={!has}
              aria-pressed={on}
              className={`relative flex flex-col items-center rounded-2xl border-4 p-2 transition ${
                has ? RARITY_BORDER[it.rarity] : "border-surface-2"
              } ${on ? "bg-primary/10" : "bg-surface"}`}
            >
              <div className="flex h-20 items-center justify-center">
                <Image
                  src={itemImage(it.id)}
                  alt={it.name}
                  width={Math.round((72 * it.w) / it.h)}
                  height={72}
                  unoptimized
                  className={`pixelated max-h-[72px] w-auto ${has ? "" : "opacity-25 grayscale"}`}
                />
              </div>
              <span className="text-sm font-bold">{has ? it.name : "???"}</span>
              <span className="text-xs text-muted">{RARITY_LABEL[it.rarity]}</span>
              {!has && <span className="absolute right-2 top-2 text-lg">🔒</span>}
              {on && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-ink">
                  놓는 중
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        {owned.size === 0 ? "아무 부위나 4레벨이 되면 첫 아이템을 뽑아요." : "아이템을 누르면 캐릭터 옆에 놓고, 다시 누르면 치워요."}
      </p>
    </section>
  );
}
