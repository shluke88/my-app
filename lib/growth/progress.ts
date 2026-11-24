// 캐릭터 성장 처리 (순수 계산): 경험치를 넣으면 레벨을 올리고, 해금 레벨에 닿을 때마다 뽑기권을 준다.
// 뽑기권은 사용자가 "아이템 뽑기"를 눌러 열 때 아이템 하나로 바뀐다. (사용자 요청: 뽑는 연출이 보이게)
import { addXp, type XpResult } from "./level";
import { drawItem, type Rng } from "./itemDraw";
import { ITEMS } from "./items";
import type { BodyPart, CharacterState, ItemDef } from "@/types";

export function ticketsOf(ch: CharacterState): number {
  return Math.max(0, ch.drawTickets ?? 0);
}

/** 경험치 적용. 이미 모든 아이템을 모았거나(또는 남은 아이템만큼 뽑기권이 있으면) 뽑기권을 더 주지 않는다 */
export function applyXp(
  ch: CharacterState,
  part: BodyPart,
  amount: number,
): { character: CharacterState; result: XpResult; ticketsAdded: number } {
  const result = addXp(ch.parts[part], amount);
  const room = Math.max(0, ITEMS.length - ch.unlockedItemIds.length - ticketsOf(ch));
  const ticketsAdded = Math.min(result.unlocks, room);
  return {
    character: {
      ...ch,
      parts: { ...ch.parts, [part]: result.next },
      drawTickets: ticketsOf(ch) + ticketsAdded,
    },
    result,
    ticketsAdded,
  };
}

/** 뽑기권 1장을 열어 아이템 하나를 얻는다. 뽑기권이 없으면 그대로 */
export function openTicket(ch: CharacterState, rng: Rng = Math.random): { character: CharacterState; item: ItemDef | null } {
  if (ticketsOf(ch) <= 0) return { character: ch, item: null };
  const item = drawItem(ch.unlockedItemIds, rng);
  return {
    character: {
      ...ch,
      drawTickets: item ? ticketsOf(ch) - 1 : 0, // 더 뽑을 아이템이 없으면 남은 뽑기권은 없앤다
      unlockedItemIds: item ? [...ch.unlockedItemIds, item.id] : ch.unlockedItemIds,
    },
    item,
  };
}
