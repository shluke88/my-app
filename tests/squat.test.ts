import { describe, expect, it } from "vitest";
import { AngleRepCounter, type RepEvent } from "@/lib/exercise/stateMachine";
import { SquatJudge } from "@/lib/exercise/judges/squat";

const cfg = { startDeg: 150, descendDeg: 135, goodDeg: 110, hysteresisDeg: 5 };

/** 각도 목록을 차례로 넣고 반복 결과만 모은다 */
function run(angles: number[], counter = new AngleRepCounter(cfg)): RepEvent[] {
  return angles.map((a) => counter.update(a)).filter((e): e is RepEvent => e !== null);
}

/** a에서 b까지 촘촘하게 이어지는 각도 */
function ramp(a: number, b: number, step = 3): number[] {
  const out: number[] = [];
  const dir = a < b ? 1 : -1;
  for (let v = a; dir > 0 ? v <= b : v >= b; v += step * dir) out.push(v);
  return out;
}

// 작업 10: 스쿼트 상태 전이 (DESIGN 8.2)
describe("스쿼트 상태 전이", () => {
  it("#2 165° → 105° → 160°는 좋음 1회", () => {
    const reps = run([...ramp(165, 105), ...ramp(105, 160)]);
    expect(reps).toHaveLength(1);
    expect(reps[0].grade).toBe("good");
  });

  it("#3 165° → 125° → 160°는 얕음 1회", () => {
    const reps = run([...ramp(165, 125), ...ramp(125, 160)]);
    expect(reps.map((r) => r.grade)).toEqual(["shallow"]);
  });

  it("#3-1 165° → 140° → 160°는 하강 인정 미도달, 반복 아님", () => {
    expect(run([...ramp(165, 140), ...ramp(140, 160)])).toHaveLength(0);
  });

  it("#4 복귀 근처 흔들림(152↔148)은 1회만", () => {
    const reps = run([...ramp(165, 105), ...ramp(105, 152), 148, 152, 148, 152, ...ramp(152, 160)]);
    expect(reps).toHaveLength(1);
  });

  it("#4-1 하강 경계 흔들림(137↔133)도 1회만", () => {
    const reps = run([165, 137, 133, 137, 133, ...ramp(133, 105), ...ramp(105, 160)]);
    expect(reps).toHaveLength(1);
    expect(reps[0].grade).toBe("good");
  });

  it("#4-2 하강 중 일시 정지 → 선 자세에서 재개하면 0회", () => {
    const c = new AngleRepCounter(cfg);
    run(ramp(165, 110), c);
    c.reset(); // 인식 일시 정지
    expect(run([160, 165], c)).toHaveLength(0);
    expect(c.inRep).toBe(false);
  });

  it("선 자세를 보기 전에는 세지 않는다", () => {
    expect(run([120, 100, 160])).toHaveLength(0);
  });

  it("연속 3회", () => {
    const one = [...ramp(160, 100), ...ramp(100, 160)];
    expect(run([...one, ...one, ...one])).toHaveLength(3);
  });

  it("평균 처리를 거친 스쿼트 판정기도 1회만 센다", () => {
    const j = new SquatJudge();
    const reps = [...ramp(170, 100, 2), ...ramp(100, 170, 2)].map((a) => j.updateAngles(a, 10).rep).filter(Boolean);
    expect(reps).toHaveLength(1);
  });
});
