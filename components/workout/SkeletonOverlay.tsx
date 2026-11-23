"use client";

// 관절점과 뼈대를 영상 위에 그린다 (PLAN 작업 7). 인식 좋음은 초록, 불안정은 주황.
// 매 장면 React로 다시 그리지 않도록, 부모가 draw()를 직접 부르는 방식으로 만든다.
import { forwardRef, useImperativeHandle, useRef } from "react";
import { LANDMARK_INDEX, SKELETON_EDGES, type Landmark } from "@/lib/pose/landmarks";
import { MIN_CONFIDENCE } from "@/lib/exercise/rules";

export interface SkeletonHandle {
  draw: (landmarks: Landmark[] | null, width: number, height: number, good: boolean) => void;
}

const SkeletonOverlay = forwardRef<SkeletonHandle>(function SkeletonOverlay(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => ({
    draw(landmarks, width, height, good) {
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
      const color = good ? "#5ee6b0" : "#ffb24a";
      const lw = Math.max(3, width / 160);
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      for (const [a, b] of SKELETON_EDGES) {
        const p = landmarks[LANDMARK_INDEX[a]];
        const q = landmarks[LANDMARK_INDEX[b]];
        if (!p || !q) continue;
        const ok = (p.visibility ?? 0) >= MIN_CONFIDENCE && (q.visibility ?? 0) >= MIN_CONFIDENCE;
        ctx.strokeStyle = ok ? color : "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.moveTo(p.x * width, p.y * height);
        ctx.lineTo(q.x * width, q.y * height);
        ctx.stroke();
      }
      for (const idx of Object.values(LANDMARK_INDEX)) {
        const p = landmarks[idx];
        if (!p) continue;
        const ok = (p.visibility ?? 0) >= MIN_CONFIDENCE;
        ctx.fillStyle = ok ? "#ffffff" : "rgba(255,107,107,0.8)";
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, lw * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  }));

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />;
});

export default SkeletonOverlay;
