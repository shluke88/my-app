// 열량(kcal) 추정 — 순수 계산. 의학적 측정이 아니라 대략적인 추정값이다.
// 공식: 분당 kcal = MET × 3.5 × 몸무게(kg) ÷ 200, 여기에 실제로 운동한 시간(분)을 곱한다.
import { DEFAULT_WEIGHT_KG, EXERCISE_MET } from "@/lib/exercise/rules";
import type { ExerciseId, SessionRecord } from "@/types";

export function estimateKcal(exercise: ExerciseId, activeSec: number, weightKg?: number): number {
  const kg = weightKg && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
  const perMin = (EXERCISE_MET[exercise] * 3.5 * kg) / 200;
  return Math.max(0, (perMin * activeSec) / 60);
}

/** 화면 표시용 반올림 (1 kcal 미만은 소수 첫째 자리) */
export function formatKcal(kcal: number): string {
  if (kcal <= 0) return "0";
  return kcal < 10 ? kcal.toFixed(1).replace(/\.0$/, "") : String(Math.round(kcal));
}

export function sessionKcal(s: SessionRecord): number {
  return s.exercises.reduce((a, e) => a + (e.kcal ?? 0), 0);
}

/** 같은 날(기기 시간 기준)인지 */
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 오늘·이번 주(월요일 시작)·저장된 전체 기록의 열량 합 */
export function kcalSummary(sessions: SessionRecord[], now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  let today = 0;
  let week = 0;
  let total = 0;
  for (const s of sessions) {
    const k = sessionKcal(s);
    const d = new Date(s.startedAt);
    total += k;
    if (d >= monday) week += k;
    if (sameDay(d, now)) today += k;
  }
  return { today, week, total };
}

/** 최근 7일(오늘 포함) 날마다의 열량 합, 오래된 날부터 */
export function kcalLast7Days(sessions: SessionRecord[], now = new Date()): { label: string; kcal: number; isToday: boolean }[] {
  const days: { label: string; kcal: number; isToday: boolean }[] = [];
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const kcal = sessions.filter((s) => sameDay(new Date(s.startedAt), d)).reduce((a, s) => a + sessionKcal(s), 0);
    days.push({ label: names[d.getDay()], kcal, isToday: i === 0 });
  }
  return days;
}
