"use client";

// 도트 캐릭터 자리. 작업 17~19에서 코드로 그린 2등신 도트 캐릭터로 바꾼다.
import type { CharacterState } from "@/types";

interface PixelCharacterProps {
  character: CharacterState;
  size?: number;
  className?: string;
}

export default function PixelCharacter({ size = 160, className = "" }: PixelCharacterProps) {
  return (
    <div
      className={`animate-breathe flex items-center justify-center rounded-2xl bg-surface-2 text-5xl ${className}`}
      style={{ width: size, height: size * 1.5 }}
      aria-label="도트 캐릭터"
    >
      🧍
    </div>
  );
}
