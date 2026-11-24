import { describe, expect, it } from "vitest";
import { PlankJudge } from "@/lib/exercise/judges/others";
import { LANDMARK_INDEX, type Landmark, type LandmarkName, type Pose } from "@/lib/pose/landmarks";

/** 왼쪽·오른쪽 같은 위치에 관절을 둔 가짜 자세 */
function pose(points: Partial<Record<"shoulder" | "hip" | "ankle" | "knee" | "elbow" | "wrist", [number, number]>>): Pose {
  const p = {} as Pose;
  for (const name of Object.keys(LANDMARK_INDEX) as LandmarkName[]) p[name] = { x: 0.5, y: 0.5, visibility: 1 } as Landmark;
  for (const [j, [x, y]] of Object.entries(points)) {
    p[`${j}L` as LandmarkName] = { x, y, visibility: 1 };
    p[`${j}R` as LandmarkName] = { x, y, visibility: 1 };
  }
  return p;
}

// 플랭크 시간 누적 (사용자 시험에서 "시간이 안 올라감" 확인용)
describe("플랭크 판정", () => {
  const lying = pose({ shoulder: [0.2, 0.6], hip: [0.5, 0.61], ankle: [0.8, 0.62] });
  const standing = pose({ shoulder: [0.5, 0.2], hip: [0.5, 0.5], ankle: [0.5, 0.9] });

  it("옆모습으로 일직선 엎드리면 시간이 올라가고 6초면 1단위", () => {
    const j = new PlankJudge();
    let out = j.update(lying, 1, 0);
    for (let t = 0.1; t <= 6.01; t += 0.1) out = j.update(lying, 1, t);
    expect(out.holdSec).toBeGreaterThan(5.5);
    expect(out.hint).toBeUndefined();
  });

  it("서 있거나 정면이면 시간이 그대로이고 이유를 알려 준다", () => {
    const j = new PlankJudge();
    let out = j.update(standing, 1, 0);
    for (let t = 0.1; t <= 3; t += 0.1) out = j.update(standing, 1, t);
    expect(out.holdSec).toBe(0);
    expect(out.valid).toBe(false);
    expect(out.hint).toContain("옆모습");
  });

  it("자세를 잡은 뒤 2초 넘게 무너지면 끝, 1초만 흔들리면 계속", () => {
    const piked = pose({ shoulder: [0.2, 0.6], hip: [0.5, 0.4], ankle: [0.8, 0.62] });
    const j = new PlankJudge();
    let t = 0;
    const run = (p: Pose, sec: number) => {
      let out = j.update(p, 1, t);
      for (let k = 0; k < sec * 10; k++) {
        t += 0.1;
        out = j.update(p, 1, t);
      }
      return out;
    };
    run(lying, 3);
    expect(run(piked, 1).ended).toBe(false); // 1초 흔들림
    expect(run(lying, 1).ended).toBe(false); // 다시 잡음
    const out = run(piked, 2.5); // 2초 넘게 무너짐
    expect(out.ended).toBe(true);
    expect(out.holdSec).toBeGreaterThan(3.5);
  });

  it("자세를 잡기 전에는 무너져 있어도 끝나지 않는다", () => {
    const j = new PlankJudge();
    let out = j.update(standing, 1, 0);
    for (let t = 0.1; t <= 5; t += 0.1) out = j.update(standing, 1, t);
    expect(out.ended).toBe(false);
  });

  it("엉덩이가 솟으면 시간이 멈추고 '엉덩이를 내려 주세요' 조건", () => {
    const j = new PlankJudge();
    const piked = pose({ shoulder: [0.2, 0.6], hip: [0.5, 0.4], ankle: [0.8, 0.62] });
    let out = j.update(piked, 1, 0);
    for (let t = 0.1; t <= 2; t += 0.1) out = j.update(piked, 1, t);
    expect(out.holdSec).toBe(0);
    expect(out.postureCueIds).toEqual(["plank-hip-high"]);
  });
});
