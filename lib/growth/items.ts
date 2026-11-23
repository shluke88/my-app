// 아이템 16개 (4종류 × 4등급). 사용자가 준 아이템 표 그림을 따른다. 그림: public/art/items/{종류}-{등급}.png
// 아이템은 입지 않고, 고르면 캐릭터 주변 바닥에 놓인다. 종류마다 하나씩 놓을 수 있다.
import type { ItemDef, ItemSlot, Rarity } from "@/types";

type Spec = { name: string; w: number; h: number };

const SPECS: Record<ItemSlot, Record<Rarity, Spec>> = {
  dumbbell: {
    normal: { name: "회색 덤벨", w: 138, h: 104 },
    rare: { name: "블랙 덤벨 세트", w: 184, h: 131 },
    epic: { name: "실버 에픽 덤벨", w: 192, h: 135 },
    legend: { name: "황금 레전드 덤벨", w: 195, h: 136 },
  },
  kettlebell: {
    normal: { name: "8kg 케틀벨", w: 104, h: 135 },
    rare: { name: "16kg 케틀벨", w: 107, h: 142 },
    epic: { name: "우주 케틀벨", w: 107, h: 142 },
    legend: { name: "불꽃 케틀벨", w: 142, h: 162 },
  },
  band: {
    normal: { name: "빨간 튜빙 밴드", w: 181, h: 126 },
    rare: { name: "3색 미니 밴드", w: 195, h: 115 },
    epic: { name: "가죽 손잡이 줄넘기", w: 162, h: 137 },
    legend: { name: "얼음빛 레전드 밴드", w: 184, h: 121 },
  },
  mat: {
    normal: { name: "파란 요가 매트", w: 185, h: 135 },
    rare: { name: "물결 폼롤러", w: 166, h: 134 },
    epic: { name: "우주 폼롤러", w: 166, h: 134 },
    legend: { name: "황금 문양 매트", w: 193, h: 141 },
  },
};

export const SLOT_ORDER: ItemSlot[] = ["dumbbell", "kettlebell", "band", "mat"];
const RARITIES: Rarity[] = ["normal", "rare", "epic", "legend"];

export const ITEMS: ItemDef[] = SLOT_ORDER.flatMap((slot) =>
  RARITIES.map((rarity) => ({ id: `${slot}-${rarity}`, slot, rarity, ...SPECS[slot][rarity] })),
);

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

export const SLOT_LABEL: Record<ItemSlot, string> = {
  dumbbell: "덤벨",
  kettlebell: "케틀벨",
  band: "밴드",
  mat: "매트",
};

/** 아이템 그림 경로 */
export function itemImage(id: string): string {
  return `/art/items/${id}.png`;
}
