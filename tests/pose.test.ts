import { describe, expect, it } from "vitest";
import { jointAngle, offsetFromLine, tiltFromHorizontal, tiltFromVertical } from "@/lib/pose/angles";
import { MovingAverage } from "@/lib/pose/smoothing";
import { ConfidenceGate } from "@/lib/pose/confidence";

// 작업 8: 각도와 흔들림 줄이기
describe("각도 계산", () => {
  it("#1 직각으로 놓인 세 점은 90°", () => {
    expect(jointAngle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90);
  });
  it("일직선은 180°", () => {
    expect(jointAngle({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 })).toBeCloseTo(180);
  });
  it("수직·수평 기울기", () => {
    expect(tiltFromVertical({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(0);
    expect(tiltFromVertical({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45);
    expect(tiltFromHorizontal({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0);
  });
  it("선보다 위에 있으면 음수", () => {
    expect(offsetFromLine({ x: 1, y: 0.8 }, { x: 0, y: 1 }, { x: 2, y: 1 })).toBeCloseTo(-0.2);
  });
  it("최근 5장면 평균", () => {
    const m = new MovingAverage(5);
    [10, 20, 30, 40, 50, 60].forEach((v) => m.push(v));
    expect(m.value()).toBe(40);
  });
});

// 작업 9: 신뢰도 일시 정지
describe("신뢰도 확인", () => {
  it("#5 신뢰도 0.5 구간은 멈추고 중단 시간을 누적", () => {
    const g = new ConfidenceGate();
    expect(g.update(0.9, 0)).toBeNull();
    expect(g.update(0.9, 0.5)).toBe("resume");
    expect(g.paused).toBe(false);
    expect(g.update(0.5, 1)).toBe("pause");
    expect(g.update(0.5, 2)).toBeNull();
    expect(g.update(0.9, 3)).toBeNull(); // 회복 시작
    expect(g.update(0.9, 3.3)).toBeNull(); // 0.5초 안 됨
    expect(g.update(0.9, 3.5)).toBe("resume");
    expect(g.pausedSec(10)).toBeCloseTo(2.5);
  });
  it("회복 중 다시 떨어지면 0.5초를 처음부터 다시 잰다", () => {
    const g = new ConfidenceGate();
    g.update(0.9, 0);
    g.update(0.9, 0.4);
    g.update(0.3, 0.45);
    expect(g.update(0.9, 0.6)).toBeNull();
    expect(g.update(0.9, 1.1)).toBe("resume");
  });
});
