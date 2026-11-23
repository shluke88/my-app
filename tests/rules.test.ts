import { describe, expect, it } from "vitest";
import { EXERCISE_RULES, ROUTINE } from "@/lib/exercise/rules";
import { ITEMS } from "@/lib/growth/items";
import { RARITY_WEIGHTS } from "@/lib/growth/config";

// 작업 2: 규칙 데이터가 PRD 숫자와 맞는지 확인
describe("규칙 데이터", () => {
  it("아이템은 20개이고 등급별 개수가 8/6/4/2", () => {
    expect(ITEMS).toHaveLength(20);
    const count = (r: string) => ITEMS.filter((i) => i.rarity === r).length;
    expect([count("normal"), count("rare"), count("epic"), count("legend")]).toEqual([8, 6, 4, 2]);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(20);
  });

  it("등급 확률 합은 100", () => {
    expect(Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("운동별 경험치와 루틴 목표", () => {
    const xp = Object.values(EXERCISE_RULES).map((r) => [r.id, r.xpPerUnit, r.xpShallow, r.routineTarget]);
    expect(xp).toEqual([
      ["squat", 5, 1, 12],
      ["lunge", 5, 1, 8],
      ["pushup", 15, 3, 8],
      ["plank", 20, 0, 30],
      ["jumpingJack", 6, 1, 20],
    ]);
    expect(ROUTINE).toEqual(["jumpingJack", "squat", "pushup", "lunge", "plank"]);
  });

  it("운동마다 안내는 최대 2개", () => {
    for (const r of Object.values(EXERCISE_RULES)) expect(r.cues.length).toBeLessThanOrEqual(2);
  });
});
