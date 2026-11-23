// 경험치·레벨 계산 (PLAN 작업 16). 다음 레벨까지 = 현재 레벨 × 50, 최대 20레벨, 넘친 경험치는 이월.
import { APPEARANCE_STAGE_LEVELS, MAX_LEVEL, UNLOCK_LEVELS, XP_PER_LEVEL_FACTOR } from "./config";
import type { PartProgress } from "@/types";

export function xpToNext(level: number): number {
  return level * XP_PER_LEVEL_FACTOR;
}

export interface XpResult {
  next: PartProgress;
  /** 실제로 들어간 경험치 (최대 레벨이면 0) */
  gained: number;
  /** 이번에 새로 도달한 레벨들 */
  reachedLevels: number[];
  /** 그중 아이템 해금 레벨 수 */
  unlocks: number;
}

export function addXp(progress: PartProgress, amount: number): XpResult {
  let { level, xp } = progress;
  if (level >= MAX_LEVEL || amount <= 0) {
    return { next: { level: Math.min(level, MAX_LEVEL), xp: level >= MAX_LEVEL ? 0 : xp }, gained: 0, reachedLevels: [], unlocks: 0 };
  }
  xp += amount;
  const reached: number[] = [];
  while (level < MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    reached.push(level);
  }
  if (level >= MAX_LEVEL) xp = 0;
  return {
    next: { level, xp },
    gained: amount,
    reachedLevels: reached,
    unlocks: reached.filter((l) => UNLOCK_LEVELS.includes(l)).length,
  };
}

/** 외형 단계 1~4 (1·5·10·15레벨) */
export function appearanceStage(level: number): number {
  let stage = 1;
  APPEARANCE_STAGE_LEVELS.forEach((l, i) => {
    if (level >= l) stage = i + 1;
  });
  return stage;
}
