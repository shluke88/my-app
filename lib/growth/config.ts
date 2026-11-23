// Design Ref: §10 — 경험치·레벨·아이템 확률 숫자는 이 파일에만 둔다.
import type { BodyPart, Rarity } from "@/types";

/** 최대 레벨 */
export const MAX_LEVEL = 20;
/** 다음 레벨까지 필요한 경험치 = 현재 레벨 × 이 값 */
export const XP_PER_LEVEL_FACTOR = 50;
/** 이 레벨에 처음 도달하면 아이템 1개 해금 */
export const UNLOCK_LEVELS = [4, 8, 12, 16, 20];
/** 외형 단계가 바뀌는 레벨 (1단계: 1~4, 2단계: 5~9, 3단계: 10~14, 4단계: 15~20) */
export const APPEARANCE_STAGE_LEVELS = [1, 5, 10, 15];
/** 등급 확률 (%) */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  normal: 60,
  rare: 28,
  epic: 10,
  legend: 2,
};
/** 낮은 등급 → 높은 등급 순서 */
export const RARITY_ORDER: Rarity[] = ["normal", "rare", "epic", "legend"];

export const RARITY_LABEL: Record<Rarity, string> = {
  normal: "노말",
  rare: "레어",
  epic: "에픽",
  legend: "레전드",
};

export const PART_LABEL: Record<BodyPart, string> = {
  lower: "하체",
  upper: "상체",
  core: "코어",
  stamina: "체력",
};

export const BODY_PARTS: BodyPart[] = ["lower", "upper", "core", "stamina"];

/** 세션 기록 보관 개수 */
export const MAX_SESSIONS = 30;
