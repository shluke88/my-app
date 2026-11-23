// 아이템 16개 (4종류 × 4등급). 사용자가 준 아이템 표 그림을 따른다. 그림: public/art/items/{종류}-{등급}.png
import type { ItemDef, ItemSlot, Rarity } from "@/types";

const NAMES: Record<ItemSlot, Record<Rarity, string>> = {
  weight: { normal: "5kg 아령", rare: "10kg 아령", epic: "20kg 아령", legend: "30kg 아령" },
  mat: { normal: "요가 매트", rare: "포른물스 폼롤러", epic: "에픽 요가 매트", legend: "전설의 요가 매트" },
  band: { normal: "모래주머니 밴드", rare: "레어 가중 밴드", epic: "에픽 가중 밴드", legend: "레전드 손발목 밴드" },
  vest: { normal: "기본 가중 조끼", rare: "강화 조끼", epic: "에픽 가중 조끼", legend: "레전드 가중 조끼" },
};

export const SLOT_ORDER: ItemSlot[] = ["weight", "mat", "band", "vest"];
const RARITIES: Rarity[] = ["normal", "rare", "epic", "legend"];

export const ITEMS: ItemDef[] = SLOT_ORDER.flatMap((slot) =>
  RARITIES.map((rarity) => ({ id: `${slot}-${rarity}`, name: NAMES[slot][rarity], slot, rarity })),
);

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

export const SLOT_LABEL: Record<ItemSlot, string> = {
  weight: "아령",
  mat: "매트",
  band: "밴드",
  vest: "조끼",
};

/** 아이템 그림 경로 */
export function itemImage(id: string): string {
  return `/art/items/${id}.png`;
}
