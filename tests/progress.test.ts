import { describe, expect, it } from "vitest";
import { applyXp, openTicket, ticketsOf } from "@/lib/growth/progress";
import { ITEMS } from "@/lib/growth/items";
import { seededRng } from "@/lib/growth/itemDraw";
import { createDefaultCharacter } from "@/lib/storage/localStore";

// 뽑기권 방식 아이템 뽑기
describe("뽑기권", () => {
  it("3→4레벨이면 뽑기권 1장, 3→8레벨이면 2장", () => {
    const ch = createDefaultCharacter();
    ch.parts.lower = { level: 3, xp: 149 };
    expect(applyXp(ch, "lower", 1).ticketsAdded).toBe(1);
    ch.parts.lower = { level: 3, xp: 0 };
    const r = applyXp(ch, "lower", 1250);
    expect(r.ticketsAdded).toBe(2);
    expect(ticketsOf(r.character)).toBe(2);
    expect(r.character.unlockedItemIds).toEqual([]); // 열기 전에는 아이템이 없다
  });

  it("뽑기권을 열면 아이템 1개를 얻고 뽑기권이 줄어든다", () => {
    const ch = { ...createDefaultCharacter(), drawTickets: 2 };
    const { character, item } = openTicket(ch, seededRng(1));
    expect(item).not.toBeNull();
    expect(character.unlockedItemIds).toEqual([item!.id]);
    expect(ticketsOf(character)).toBe(1);
  });

  it("뽑기권이 없으면 아무 일도 없다", () => {
    const ch = createDefaultCharacter();
    expect(openTicket(ch).item).toBeNull();
  });

  it("아이템을 다 모았으면 뽑기권을 더 주지 않는다", () => {
    const ch = createDefaultCharacter();
    ch.unlockedItemIds = ITEMS.map((i) => i.id);
    ch.parts.core = { level: 3, xp: 149 };
    expect(applyXp(ch, "core", 1).ticketsAdded).toBe(0);
  });
});
