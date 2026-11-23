// 아이템 뽑기 (PLAN 작업 20). 난수 함수를 밖에서 넣어 테스트에서 결과를 고정할 수 있다.
// 등급: 노말 60 / 레어 28 / 에픽 10 / 레전드 2
// 그 등급을 다 모았으면 한 단계 위 → 레전드까지 다 모았으면 남은 아이템이 있는 가장 높은 등급
import { RARITY_ORDER, RARITY_WEIGHTS } from "./config";
import { ITEMS } from "./items";
import type { ItemDef, Rarity } from "@/types";

export type Rng = () => number;

export function drawRarity(rng: Rng): Rarity {
  const r = rng() * 100;
  let acc = 0;
  for (const rarity of RARITY_ORDER) {
    acc += RARITY_WEIGHTS[rarity];
    if (r < acc) return rarity;
  }
  return "legend";
}

export function drawItem(unlockedIds: string[], rng: Rng = Math.random): ItemDef | null {
  const owned = new Set(unlockedIds);
  const left = (r: Rarity) => ITEMS.filter((i) => i.rarity === r && !owned.has(i.id));
  const drawn = drawRarity(rng);
  let pool: ItemDef[] = [];
  // 뽑힌 등급부터 위로
  for (let i = RARITY_ORDER.indexOf(drawn); i < RARITY_ORDER.length && pool.length === 0; i++) pool = left(RARITY_ORDER[i]);
  // 위가 모두 찼으면 남은 것 중 가장 높은 등급
  for (let i = RARITY_ORDER.length - 1; i >= 0 && pool.length === 0; i--) pool = left(RARITY_ORDER[i]);
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

/** 고정 난수 (테스트용) */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
