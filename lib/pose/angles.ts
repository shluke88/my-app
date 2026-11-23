// 세 관절점으로 각도를 계산하는 순수 함수 (PLAN 작업 8)
import type { Point } from "./landmarks";

const DEG = 180 / Math.PI;

/** b를 꼭짓점으로 하는 a-b-c 각도 (0~180°) */
export function jointAngle(a: Point, b: Point, c: Point): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  if (n1 === 0 || n2 === 0) return 180;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / (n1 * n2)));
  return Math.acos(cos) * DEG;
}

/** 두 점을 이은 선이 수직선에서 기운 각도 (0° = 똑바로 섬, 90° = 누움) */
export function tiltFromVertical(top: Point, bottom: Point): number {
  const dx = Math.abs(top.x - bottom.x);
  const dy = Math.abs(top.y - bottom.y);
  if (dx === 0 && dy === 0) return 0;
  return Math.atan2(dx, dy) * DEG;
}

/** 두 점을 이은 선이 수평선에서 기운 각도 (0° = 수평) */
export function tiltFromHorizontal(a: Point, b: Point): number {
  return 90 - tiltFromVertical(a, b);
}

/**
 * 점 p가 a-b 선보다 화면에서 위(-) 또는 아래(+)에 얼마나 있는지 (y는 아래로 갈수록 큼).
 * 플랭크에서 엉덩이가 어깨-발목 선보다 위인지 아래인지 볼 때 쓴다.
 */
export function offsetFromLine(p: Point, a: Point, b: Point): number {
  if (a.x === b.x) return 0;
  const t = (p.x - a.x) / (b.x - a.x);
  const lineY = a.y + t * (b.y - a.y);
  return p.y - lineY;
}
