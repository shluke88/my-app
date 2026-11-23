"use client";

// Design Ref: §5.3 — 꾸미기: 종류 탭(아령·매트·밴드·조끼), 해금 아이템(등급 테두리)과 잠긴 아이템(자물쇠),
// 누르면 입히기, 다시 누르면 벗기기 (PLAN 작업 21)
import { useState } from "react";
import { ITEMS, SLOT_LABEL, SLOT_ORDER, itemImage } from "@/lib/growth/items";
import { RARITY_LABEL } from "@/lib/growth/config";
import { loadCharacter, saveCharacter } from "@/lib/storage/localStore";
import type { CharacterState, ItemSlot } from "@/types";

export const RARITY_BORDER = {
  normal: "border-rarity-normal",
  rare: "border-rarity-rare",
  epic: "border-rarity-epic",
  legend: "border-rarity-legend",
} as const;

export default function Wardrobe({ character }: { character: CharacterState }) {
  const [slot, setSlot] = useState<ItemSlot>("weight");
  const owned = new Set(character.unlockedItemIds);

  const toggle = (id: string) => {
    const ch = loadCharacter();
    if (!ch.unlockedItemIds.includes(id)) return;
    if (ch.equipped[slot] === id) delete ch.equipped[slot];
    else ch.equipped[slot] = id;
    saveCharacter(ch);
  };

  return (
    <section className="rounded-3xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">꾸미기</h2>
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
            className={`min-h-11 rounded-xl text-base font-bold ${slot === s ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            {SLOT_LABEL[s]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {ITEMS.filter((i) => i.slot === slot).map((item) => {
          const has = owned.has(item.id);
          const on = character.equipped[slot] === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!has}
              onClick={() => toggle(item.id)}
              aria-pressed={on}
              aria-label={`${item.name} (${RARITY_LABEL[item.rarity]})${has ? (on ? " 입는 중" : "") : " 잠김"}`}
              className={`relative flex aspect-square items-center justify-center rounded-2xl border-[3px] bg-white p-1.5 ${
                RARITY_BORDER[item.rarity]
              } ${on ? "ring-4 ring-primary/40" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={itemImage(item.id)}
                alt=""
                className={`pixelated max-h-full max-w-full ${has ? "" : "opacity-25 grayscale"}`}
                draggable={false}
              />
              {!has && <span className="absolute text-xl">🔒</span>}
              {on && (
                <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        {ITEMS.filter((i) => i.slot === slot)
          .map((i) => `${RARITY_LABEL[i.rarity]} ${i.name}`)
          .join(" · ")}
      </p>
      {owned.size === 0 && (
        <p className="mt-2 text-center text-muted">아무 부위나 4레벨이 되면 첫 아이템을 뽑아요.</p>
      )}
    </section>
  );
}
