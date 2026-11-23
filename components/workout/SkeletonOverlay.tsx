"use client";

// 관절점과 뼈대를 영상 위에 그린다 (PLAN 작업 7).
// 판정에 쓰는 쪽 몸은 초록, 반대쪽은 보라, 인식이 불안정하면 주황. (사용자가 준 운동 화면 그림)
// 매 장면 React로 다시 그리지 않도록, 부모가 draw()를 직접 부르는 방식으로 만든다.
import { forwardRef, useImperativeHandle, useRef } from "react";
import { LANDMARK_INDEX, SKELETON_EDGES, type Landmark, type LandmarkName } from "@/lib/pose/landmarks";
import { MIN_CONFIDENCE } from "@/lib/exercise/rules";

export interface SkeletonHandle {
  draw: (landmarks: Landmark[] | null, width: number, height: number, good: boolean, side?: "L" | "R") => void;
}

const GREEN = "#4ade80";
const PURPLE = "#8b5cf6";
const ORANGE = "#ffb24a";

/** 관절 이름 끝 글자로 어느 쪽 몸인지 */
function sideOf(name: LandmarkName): "L" | "R" | null {
  const last = name.at(-1);
  return last === "L" || last === "R" ? last : null;
}

const SkeletonOverlay = forwardRef<SkeletonHandle, { fit?: "cover" | "contain" }>(function SkeletonOverlay(
  { fit = "contain" },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => ({
    draw(landmarks, width, height, good, side) {
      const c = canvasRef.current;
      if (!c) return;
      if (c.width !== width || c.height !== height) {
        c.width = width;
        c.height = height;
      }
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      if (!landmarks) return;
      const lw = Math.max(3, width / 130);
      const colorFor = (a: LandmarkName, b: LandmarkName) => {
        if (!good) return ORANGE;
        if (!side) return GREEN;
        const sa = sideOf(a);
        const sb = sideOf(b);
        // 반대쪽 팔·다리만 보라, 몸통과 판정 쪽은 초록
        return sa === sb && sa !== side ? PURPLE : GREEN;
      };
      ctx.lineCap = "round";
      ctx.lineWidth = lw;
      for (const [a, b] of SKELETON_EDGES) {
        const p = landmarks[LANDMARK_INDEX[a]];
        const q = landmarks[LANDMARK_INDEX[b]];
        if (!p || !q) continue;
        const ok = (p.visibility ?? 0) >= MIN_CONFIDENCE && (q.visibility ?? 0) >= MIN_CONFIDENCE;
        ctx.strokeStyle = ok ? colorFor(a, b) : "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(p.x * width, p.y * height);
        ctx.lineTo(q.x * width, q.y * height);
        ctx.stroke();
      }
      for (const [name, idx] of Object.entries(LANDMARK_INDEX) as [LandmarkName, number][]) {
        if (name === "nose") continue;
        const p = landmarks[idx];
        if (!p || (p.visibility ?? 0) < MIN_CONFIDENCE) continue;
        const s = sideOf(name);
        const stroke = !good ? ORANGE : side && s && s !== side ? PURPLE : GREEN;
        const r = lw * 1.5;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lw * 0.8;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
    />
  );
});

export default SkeletonOverlay;
