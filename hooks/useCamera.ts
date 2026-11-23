"use client";

// Design Ref: §6 오류 처리 — 전면 카메라 켜기·끄기, 권한 거부·오류 안내, 화면 이탈·권한 회수 시 즉시 해제.
// 영상은 <video>에 보여 주기만 하고 녹화·저장·전송하지 않는다.
import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "starting" | "ready" | "error";
export type CameraError = "denied" | "unavailable" | "insecure" | "unknown";

export const CAMERA_ERROR_TEXT: Record<CameraError, { title: string; help: string }> = {
  denied: {
    title: "카메라 권한이 꺼져 있어요",
    help: "주소창 옆 자물쇠(또는 설정) → 카메라 → 허용으로 바꾼 뒤 다시 시도해 주세요.",
  },
  unavailable: {
    title: "카메라를 사용할 수 없어요",
    help: "다른 앱을 닫고 다시 시도해 주세요.",
  },
  insecure: {
    title: "https 주소로 접속해 주세요",
    help: "보안 주소(https)에서만 카메라를 켤 수 있어요.",
  },
  unknown: {
    title: "카메라를 켜지 못했어요",
    help: "잠시 뒤 다시 시도해 주세요.",
  },
};

function toCameraError(e: unknown): CameraError {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "NotReadableError" || name === "OverconstrainedError" || name === "AbortError")
    return "unavailable";
  return "unknown";
}

interface UseCameraOptions {
  /** 화면 이탈·권한 회수로 카메라가 꺼졌을 때 (운동 결과 저장 등) */
  onLost?: () => void;
}

export function useCamera({ onLost }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileUrlRef = useRef<string | null>(null);
  const onLostRef = useRef(onLost);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<CameraError | null>(null);
  /** 개발 모드 영상 파일을 쓰는 중인지 (좌우 반전하지 않음) */
  const [isFile, setIsFile] = useState(false);

  useEffect(() => {
    onLostRef.current = onLost;
  }, [onLost]);

  /** 카메라와 영상 파일을 모두 끈다 */
  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = null;
    }
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.srcObject = null;
      v.removeAttribute("src");
    }
    setStatus("idle");
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError("insecure");
      setStatus("error");
      return;
    }
    stop();
    setError(null);
    setIsFile(false);
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      // 권한 회수·장치 분리 시 카메라가 끊기면 정리한다
      stream.getVideoTracks().forEach((t) =>
        t.addEventListener("ended", () => {
          stop();
          onLostRef.current?.();
        }),
      );
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        v.muted = true;
        await v.play().catch(() => {});
      }
      setStatus("ready");
    } catch (e) {
      setError(toCameraError(e));
      setStatus("error");
    }
  }, [stop]);

  /** 개발 모드 전용: 테스트 영상 파일을 카메라 대신 입력으로 쓴다 (PLAN 작업 9) */
  const startFile = useCallback(
    async (file: File) => {
      stop();
      setError(null);
      setIsFile(true);
      const url = URL.createObjectURL(file);
      fileUrlRef.current = url;
      const v = videoRef.current;
      if (v) {
        v.src = url;
        v.loop = true;
        v.muted = true;
        await v.play().catch(() => {});
      }
      setStatus("ready");
    },
    [stop],
  );

  // 화면을 벗어나면(다른 앱·탭) 카메라를 즉시 끈다. 화면을 떠날 때(언마운트)도 끈다.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && streamRef.current) {
        stop();
        onLostRef.current?.();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      stop();
    };
  }, [stop]);

  return { videoRef, status, error, isFile, start, startFile, stop };
}
