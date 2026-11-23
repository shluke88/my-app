"use client";

// 도트 캐릭터: 사용자가 준 남성·여성 기본 캐릭터 그림을 쓴다. (public/art)
// 레벨에 따라 외형은 바뀌지 않고, 입은 아이템만 바뀐다(아이템 그림은 받는 대로 겹쳐 그린다).
// 가만히 있으면 어색하니 숨 쉬는 작은 움직임을 넣는다.
import Image from "next/image";
import { useSettings } from "@/hooks/useStored";
import type { CharacterState, Gender } from "@/types";

const ART: Record<Gender, { src: string; w: number; h: number }> = {
  male: { src: "/art/character-male.png", w: 171, h: 287 },
  female: { src: "/art/character-female.png", w: 105, h: 152 },
};

interface PixelCharacterProps {
  character: CharacterState;
  /** 캐릭터 그림의 높이(px) */
  size?: number;
  className?: string;
}

export default function PixelCharacter({ size = 160, className = "" }: PixelCharacterProps) {
  const { settings } = useSettings();
  // 성별을 고르지 않았으면 남성 기본형
  const art = ART[settings.gender ?? "male"];
  const width = Math.round((size * art.w) / art.h);

  return (
    <div className={`flex justify-center ${className}`} style={{ height: size }} aria-label="도트 캐릭터">
      <Image
        src={art.src}
        alt=""
        width={width}
        height={size}
        unoptimized
        priority
        draggable={false}
        className="pixelated animate-breathe select-none"
        style={{ width, height: size }}
      />
    </div>
  );
}
