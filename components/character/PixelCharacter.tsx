"use client";

// 도트 캐릭터: 사용자가 준 남성·여성 기본 캐릭터 그림을 쓴다. (public/art)
// 레벨에 따라 외형은 바뀌지 않는다. 고른 아이템은 입지 않고 캐릭터 주변 바닥에 놓아 둔다.
//   뒤쪽 왼편: 매트 · 뒤쪽 오른편: 밴드 · 앞쪽 왼편: 덤벨 · 앞쪽 오른편: 케틀벨
// 가만히 있으면 어색하니 캐릭터는 숨 쉬듯, 아이템은 살짝 둥실거리게 움직인다.
import Image from "next/image";
import { useSettings } from "@/hooks/useStored";
import { ITEM_BY_ID, itemImage } from "@/lib/growth/items";
import type { CharacterState, Gender, ItemSlot } from "@/types";

const ART: Record<Gender, { src: string; w: number; h: number }> = {
  male: { src: "/art/character-male.png", w: 171, h: 287 },
  female: { src: "/art/character-female.png", w: 105, h: 152 },
};

/** 아이템 자리 (캐릭터 키 대비 비율). left/right는 장면 너비 기준 %, bottom은 장면 높이 기준 % */
const PLACE: Record<ItemSlot, { h: number; left?: number; right?: number; bottom: number; z: number; delay: string }> = {
  mat: { h: 0.27, left: 0, bottom: 16, z: 0, delay: "0s" },
  band: { h: 0.22, right: 0, bottom: 18, z: 0, delay: "0.6s" },
  dumbbell: { h: 0.24, left: 3, bottom: 0, z: 20, delay: "0.3s" },
  kettlebell: { h: 0.29, right: 4, bottom: 0, z: 20, delay: "0.9s" },
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
  const charW = Math.round((size * art.w) / art.h);
  const sceneW = Math.round(size * 1.45);
  const sceneH = Math.round(size * 1.06);

  const placed = Object.values(character.equipped)
    .map((id) => (id ? ITEM_BY_ID[id] : undefined))
    .filter((it) => it !== undefined);

  return (
    <div
      className={`relative mx-auto max-w-full ${className}`}
      style={{ width: sceneW, height: sceneH }}
      aria-label="도트 캐릭터"
    >
      {placed.map((it) => {
        const p = PLACE[it.slot];
        const h = Math.round(size * p.h);
        const w = Math.round((h * it.w) / it.h);
        return (
          <div
            key={it.id}
            className="absolute"
            style={{
              left: p.left !== undefined ? `${p.left}%` : undefined,
              right: p.right !== undefined ? `${p.right}%` : undefined,
              bottom: `${p.bottom}%`,
              zIndex: p.z,
            }}
          >
            <Image
              src={itemImage(it.id)}
              alt={it.name}
              width={w}
              height={h}
              unoptimized
              draggable={false}
              className="pixelated animate-float select-none"
              style={{ width: w, height: h, animationDelay: p.delay }}
            />
          </div>
        );
      })}
      {/* 캐릭터: 가운데, 바닥에서 살짝 띄워 매트·밴드와 겹쳐 보이게 */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: `${(sceneH - size) / 2}px`, zIndex: 10 }}>
        <Image
          src={art.src}
          alt=""
          width={charW}
          height={size}
          unoptimized
          priority
          draggable={false}
          className="pixelated animate-breathe select-none"
          style={{ width: charW, height: size }}
        />
      </div>
    </div>
  );
}
