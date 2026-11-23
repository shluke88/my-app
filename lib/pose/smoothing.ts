// 각도 흔들림을 줄이는 처리 (PLAN 작업 8): 최근 N장면의 값을 평균한다.
import { SMOOTH_FRAMES } from "@/lib/exercise/rules";

export class MovingAverage {
  private values: number[] = [];
  constructor(private readonly size: number = SMOOTH_FRAMES) {}

  push(value: number): number {
    this.values.push(value);
    if (this.values.length > this.size) this.values.shift();
    return this.value();
  }

  value(): number {
    if (this.values.length === 0) return NaN;
    return this.values.reduce((a, b) => a + b, 0) / this.values.length;
  }

  reset(): void {
    this.values = [];
  }
}

/** 이름별로 따로 평균을 내는 묶음 */
export class SmootherSet {
  private map = new Map<string, MovingAverage>();
  constructor(private readonly size: number = SMOOTH_FRAMES) {}

  push(name: string, value: number): number {
    let m = this.map.get(name);
    if (!m) {
      m = new MovingAverage(this.size);
      this.map.set(name, m);
    }
    return m.push(value);
  }

  reset(): void {
    this.map.clear();
  }
}
