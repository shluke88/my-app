// 운동 선택 화면·정보(i) 버튼에 보여 줄 짧은 설명 (화면 문구 데이터)
import type { ExerciseId } from "@/types";

export const EXERCISE_INFO: Record<ExerciseId, { emoji: string; summary: string; howTo: string[] }> = {
  squat: {
    emoji: "🦵",
    summary: "하체 · 옆모습",
    howTo: ["발을 어깨너비로 벌리고 서요", "엉덩이를 뒤로 빼며 무릎이 110°보다 깊게 앉아요", "상체는 너무 숙이지 않아요"],
  },
  lunge: {
    emoji: "🚶",
    summary: "하체 · 옆모습",
    howTo: ["한 발을 앞으로 크게 내딛어요", "앞 무릎을 깊게 굽혀 내려가요", "상체는 세운 채로 돌아와요"],
  },
  pushup: {
    emoji: "💪",
    summary: "상체 · 옆모습 · 바닥",
    howTo: ["어깨 아래에 손을 짚고 몸을 일직선으로", "팔꿈치가 90°보다 깊게 내려가요", "엉덩이가 처지거나 솟지 않게 해요"],
  },
  plank: {
    emoji: "🧱",
    summary: "코어 · 옆모습 · 바닥",
    howTo: ["팔꿈치를 어깨 아래에 대고 엎드려요", "어깨-엉덩이-발목을 일직선으로 유지해요", "기준 자세 5초마다 경험치가 쌓여요"],
  },
  jumpingJack: {
    emoji: "🤸",
    summary: "체력 · 정면",
    howTo: ["다리를 모으고 팔을 내린 채 서요", "뛰며 다리를 넓게 벌리고 팔을 머리 위로", "다시 모은 자세로 돌아와요"],
  },
};
