import { describe, expect, it } from "vitest";
import { estimateKcal, formatKcal, kcalLast7Days, kcalSummary } from "@/lib/growth/calories";
import type { SessionRecord } from "@/types";

const session = (startedAt: string, kcal: number): SessionRecord => ({
  id: startedAt,
  startedAt,
  mode: "single",
  durationSec: 60,
  exercises: [{ exercise: "squat", goodReps: 1, shallowReps: 0, cueCount: 0, pausedSec: 0, xpGained: 5, kcal }],
  newItemIds: [],
});

// 열량 추정 (사용자 요청으로 앞당긴 2단계 기능)
describe("열량 추정", () => {
  it("점핑잭 8 MET, 70kg, 1분 = 9.8 kcal", () => {
    expect(estimateKcal("jumpingJack", 60, 70)).toBeCloseTo(9.8);
  });
  it("몸무게가 없으면 65kg으로 계산", () => {
    expect(estimateKcal("squat", 60)).toBeCloseTo((5 * 3.5 * 65) / 200);
  });
  it("표시 반올림", () => {
    expect(formatKcal(0)).toBe("0");
    expect(formatKcal(3.04)).toBe("3");
    expect(formatKcal(3.46)).toBe("3.5");
    expect(formatKcal(12.6)).toBe("13");
  });
  it("오늘·이번 주·전체 합과 최근 7일", () => {
    const now = new Date(2026, 10, 26, 12); // 목요일
    const list = [
      session(new Date(2026, 10, 26, 9).toISOString(), 10), // 오늘
      session(new Date(2026, 10, 24, 9).toISOString(), 5), // 이번 주 화요일
      session(new Date(2026, 10, 20, 9).toISOString(), 7), // 지난주
    ];
    expect(kcalSummary(list, now)).toEqual({ today: 10, week: 15, total: 22 });
    const days = kcalLast7Days(list, now);
    expect(days).toHaveLength(7);
    expect(days[6]).toMatchObject({ kcal: 10, isToday: true });
    expect(days[0].kcal).toBe(7); // 6일 전 = 11/20
  });
});
