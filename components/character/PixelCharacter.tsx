"use client";

// 도트 캐릭터: 사용자가 준 남성·여성 기본 캐릭터 그림(public/art) 위에 입은 아이템을 겹쳐 그린다.
// 레벨에 따라 외형은 바뀌지 않고, 아이템만 바뀐다.
// - 매트: 발밑에 깔림  - 아령: 캐릭터 옆 바닥  - 조끼: 몸통에 입음  - 밴드: 양 손목에 참
// 캐릭터·조끼·밴드는 함께 숨 쉬듯 살짝 움직인다.
import { useSettings } from "@/hooks/useStored";
import { itemImage } from "@/lib/growth/items";
import type { CharacterState, Gender } from "@/types";

interface Anchor {
  /** 그림 원본 크기 */
  w: number;
  h: number;
  /** 몸통 가운데와 조끼 크기 (캐릭터 상자 대비 %) */
  vest: { cx: number; top: number; width: number };
  /** 두 손 위치 */
  hands: { x: number; y: number }[];
  band: number;
}

const ART: Record<Gender, { src: string } & Anchor> = {
  male: {
    src: "/art/character-male.png",
    w: 171,
    h: 287,
    vest: { cx: 58, top: 56, width: 52 },
    hands: [
      { x: 31, y: 80 },
      { x: 79, y: 78 },
    ],
    band: 20,
  },
  female: {
    src: "/art/character-female.png",
    w: 105,
    h: 152,
    vest: { cx: 51, top: 59, width: 48 },
    hands: [
      { x: 30, y: 81 },
      { x: 66, y: 80 },
    ],
    band: 22,
  },
};

interface PixelCharacterProps {
  character: CharacterState;
  /** 캐릭터 그림의 높이(px) */
  size?: number;
  className?: string;
}

export default function PixelCharacter({ character, size = 160, className = "" }: PixelCharacterProps) {
  const { settings } = useSettings();
  // 성별을 고르지 않았으면 남성 기본형
  const art = ART[settings.gender ?? "male"];
  const width = Math.round((size * art.w) / art.h);
  const eq = character.equipped;

  return (
    <div className={`flex justify-center ${className}`} style={{ height: size }} aria-label="도트 캐릭터">
      <div className="relative" style={{ width, height: size }}>
        {/* 매트: 발밑에 깔림 */}
        {eq.mat && (
          // eslint-disable-next-line @next/next/no-img-element -- 도트 그림을 원본 그대로 겹쳐 그린다
          <img
            src={itemImage(eq.mat)}
            alt=""
            draggable={false}
            className="pixelated pointer-events-none absolute left-1/2 select-none"
            style={{ width: width * 1.7, bottom: -size * 0.1, transform: "translateX(-50%) scaleY(0.55)", transformOrigin: "bottom" }}
          />
        )}
        {/* 캐릭터 + 입는 장비 (함께 숨쉬기) */}
        <div className="animate-breathe absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={art.src} alt="" draggable={false} className="pixelated h-full w-full select-none" />
          {eq.vest && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={itemImage(eq.vest)}
              alt=""
              draggable={false}
              className="pixelated pointer-events-none absolute select-none"
              style={{ width: `${art.vest.width}%`, left: `${art.vest.cx}%`, top: `${art.vest.top}%`, transform: "translateX(-50%)" }}
            />
          )}
          {eq.band &&
            art.hands.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={itemImage(eq.band!)}
                alt=""
                draggable={false}
                className="pixelated pointer-events-none absolute select-none"
                style={{ width: `${art.band}%`, left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
              />
            ))}
        </div>
        {/* 아령: 캐릭터 옆 바닥 */}
        {eq.weight && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={itemImage(eq.weight)}
            alt=""
            draggable={false}
            className="pixelated pointer-events-none absolute select-none"
            style={{ width: width * 0.62, left: "88%", bottom: 0 }}
          />
        )}
      </div>
    </div>
  );
}
