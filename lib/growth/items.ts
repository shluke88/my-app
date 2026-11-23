// Design Ref: §11.3.1 — 아이템 20개 (노말 8, 레어 6, 에픽 4, 레전드 2)
import type { ItemDef, ItemSlot } from "@/types";

export const ITEMS: ItemDef[] = [
  // 노말 (8)
  { id: "hat-red-cap", name: "빨간 모자", slot: "hat", rarity: "normal" },
  { id: "hat-green-band", name: "초록 머리띠", slot: "hat", rarity: "normal" },
  { id: "top-blue-tee", name: "파란 티셔츠", slot: "top", rarity: "normal" },
  { id: "top-yellow-tee", name: "노란 티셔츠", slot: "top", rarity: "normal" },
  { id: "bottom-gray-shorts", name: "회색 반바지", slot: "bottom", rarity: "normal" },
  { id: "bottom-black-pants", name: "검은 트레이닝 바지", slot: "bottom", rarity: "normal" },
  { id: "shoes-white", name: "흰 운동화", slot: "shoes", rarity: "normal" },
  { id: "bg-park", name: "공원", slot: "background", rarity: "normal" },
  // 레어 (6)
  { id: "hat-baseball", name: "야구 모자", slot: "hat", rarity: "rare" },
  { id: "hat-goggles", name: "스포츠 고글", slot: "hat", rarity: "rare" },
  { id: "top-stripe", name: "줄무늬 운동복", slot: "top", rarity: "rare" },
  { id: "bottom-blue-jogger", name: "파란 조거 바지", slot: "bottom", rarity: "rare" },
  { id: "shoes-red-runner", name: "빨간 러닝화", slot: "shoes", rarity: "rare" },
  { id: "bg-gym", name: "체육관", slot: "background", rarity: "rare" },
  // 에픽 (4)
  { id: "top-hoodie", name: "후드 집업", slot: "top", rarity: "epic" },
  { id: "bottom-bolt-leggings", name: "번개 무늬 레깅스", slot: "bottom", rarity: "epic" },
  { id: "shoes-gold", name: "금빛 운동화", slot: "shoes", rarity: "epic" },
  { id: "bg-sunset", name: "해변 노을", slot: "background", rarity: "epic" },
  // 레전드 (2)
  { id: "hat-crown", name: "황금 왕관", slot: "hat", rarity: "legend" },
  { id: "bg-space", name: "별빛 우주", slot: "background", rarity: "legend" },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

export const SLOT_LABEL: Record<ItemSlot, string> = {
  hat: "모자",
  top: "상의",
  bottom: "하의",
  shoes: "신발",
  background: "배경",
};

export const SLOT_ORDER: ItemSlot[] = ["hat", "top", "bottom", "shoes", "background"];
