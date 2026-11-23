"use client";

// Design Ref: §5.3 — 전면 카메라 영상 (거울처럼 좌우 반전해서 보여 준다). 뼈대는 children으로 위에 겹친다.
import type { ReactNode, RefObject } from "react";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** 영상 파일 입력이면 반전하지 않는다 */
  mirrored?: boolean;
  /** 인식이 불안정할 때 어둡게 */
  dimmed?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function CameraView({ videoRef, mirrored = true, dimmed, className = "", children }: CameraViewProps) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <div className="absolute inset-0" style={{ transform: mirrored ? "scaleX(-1)" : undefined }}>
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`h-full w-full object-contain transition ${dimmed ? "brightness-50" : ""}`}
        />
        {children}
      </div>
    </div>
  );
}
