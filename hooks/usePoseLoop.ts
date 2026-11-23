"use client";

// 매 장면 자세 인식 반복 (PLAN 작업 6). 영상의 새 장면이 있을 때만 인식하고 onFrame으로 넘긴다.
import { useEffect, useRef, useState, type RefObject } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { detectPose, loadPoseLandmarker } from "@/lib/pose/detector";
import type { Landmark } from "@/lib/pose/landmarks";

export type ModelStatus = "loading" | "slow" | "ready" | "error";

export interface PoseFrame {
  landmarks: Landmark[] | null;
  /** 초 단위 시각 */
  t: number;
  /** 영상 가로/세로 비율 */
  aspect: number;
  width: number;
  height: number;
}

interface Options {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** 카메라가 켜져 있을 때만 돈다 */
  active: boolean;
  onFrame: (frame: PoseFrame) => void;
}

export function usePoseLoop({ videoRef, active, onFrame }: Options) {
  const [status, setStatus] = useState<ModelStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  // 모델 불러오기. 5초가 지나면 "시간이 걸리고 있어요" 안내
  useEffect(() => {
    let cancelled = false;
    const slowTimer = window.setTimeout(() => !cancelled && setStatus((s) => (s === "loading" ? "slow" : s)), 5000);
    loadPoseLandmarker()
      .then((lm) => {
        if (cancelled) return;
        landmarkerRef.current = lm;
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, [retryKey]);

  useEffect(() => {
    if (!active || status !== "ready") return;
    let raf = 0;
    let lastVideoTime = -1;
    let lastTs = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const v = videoRef.current;
      const lm = landmarkerRef.current;
      if (!v || !lm || v.readyState < 2 || v.videoWidth === 0) return;
      if (v.currentTime === lastVideoTime) return;
      lastVideoTime = v.currentTime;
      // 모델은 시각이 계속 커져야 하므로 화면 시각을 쓴다
      const ts = Math.max(performance.now(), lastTs + 1);
      lastTs = ts;
      try {
        const landmarks = detectPose(lm, v, ts);
        onFrameRef.current({
          landmarks,
          t: ts / 1000,
          aspect: v.videoWidth / v.videoHeight,
          width: v.videoWidth,
          height: v.videoHeight,
        });
      } catch {
        // 한 장면 실패는 건너뛴다
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, status, videoRef]);

  const retry = () => {
    setStatus("loading");
    setRetryKey((k) => k + 1);
  };

  return { status, retry };
}
