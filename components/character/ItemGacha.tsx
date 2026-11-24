"use client";

// 아이템 뽑기: 뽑기권이 있으면 버튼이 보이고, 누르면 상자가 흔들리다 열리며 등급 색으로 빛나는 아이템이 나온다.
// 확률(노말 60·레어 28·에픽 10·레전드 2)과 중복 처리는 lib/growth/itemDraw.ts 그대로다.
import Image from "next/image";
import { useState } from "react";
import BigButton from "@/components/common/BigButton";
import { useCharacter } from "@/hooks/useStored";
import { RARITY_LABEL } from "@/lib/growth/config";
import { SLOT_LABEL, itemImage } from "@/lib/growth/items";
import { openTicket, ticketsOf } from "@/lib/growth/progress";
import { loadCharacter, saveCharacter } from "@/lib/storage/localStore";
import type { ItemDef, Rarity } from "@/types";

const GLOW: Record<Rarity, { ring: string; text: string; bg: string }> = {
  normal: { ring: "rgba(154,160,170,0.7)", text: "text-[#c9ced6]", bg: "from-[#9aa0aa]/40" },
  rare: { ring: "rgba(77,163,255,0.8)", text: "text-[#7cc0ff]", bg: "from-[#4da3ff]/45" },
  epic: { ring: "rgba(180,107,255,0.85)", text: "text-[#cf9dff]", bg: "from-[#b46bff]/50" },
  legend: { ring: "rgba(255,157,46,0.95)", text: "text-[#ffc46b]", bg: "from-[#ff9d2e]/55" },
};

/** 뽑기권이 있을 때만 보이는 버튼 + 뽑기 화면 */
export default function GachaButton({ className = "" }: { className?: string }) {
  const { character, ready } = useCharacter();
  const [open, setOpen] = useState(false);
  const tickets = ticketsOf(character);
  if (!ready || (tickets <= 0 && !open)) return null;
  return (
    <>
      {tickets > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`animate-pop flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffd75e] to-[#e08a1e] text-xl font-extrabold text-[#3b2300] shadow-[0_0_24px_rgba(255,200,80,0.5)] ${className}`}
        >
          <span className="animate-shake inline-block">🎁</span> 아이템 뽑기
          <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-base">{tickets}장</span>
        </button>
      )}
      {open && <GachaModal onClose={() => setOpen(false)} />}
    </>
  );
}

type Phase = "box" | "shaking" | "reveal" | "empty";

function GachaModal({ onClose }: { onClose: () => void }) {
  const { character } = useCharacter();
  const [phase, setPhase] = useState<Phase>("box");
  const [item, setItem] = useState<ItemDef | null>(null);
  const [placed, setPlaced] = useState(false);
  const tickets = ticketsOf(character);

  const draw = () => {
    setPhase("shaking");
    setPlaced(false);
    // 흔들리는 연출 뒤 결과 공개 (결과는 지금 정해서 바로 저장한다)
    const { character: next, item: got } = openTicket(loadCharacter());
    saveCharacter(next);
    window.setTimeout(() => {
      setItem(got);
      setPhase(got ? "reveal" : "empty");
    }, 1300);
  };

  const place = () => {
    if (!item) return;
    const ch = loadCharacter();
    ch.equipped[item.slot] = item.id;
    saveCharacter(ch);
    setPlaced(true);
  };

  const glow = item ? GLOW[item.rarity] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5" role="dialog" aria-label="아이템 뽑기">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-center">
        {phase === "box" || phase === "shaking" ? (
          <>
            <p className="text-2xl font-extrabold">아이템 뽑기</p>
            <p className="mt-1 text-sm text-muted">남은 뽑기권 {tickets}장</p>
            <div className="my-8 flex h-40 items-center justify-center">
              <span className={`text-[7rem] leading-none ${phase === "shaking" ? "animate-shake" : "animate-float"}`}>🎁</span>
            </div>
            <BigButton onClick={draw} disabled={phase === "shaking" || tickets <= 0}>
              {phase === "shaking" ? "두근두근…" : "열기!"}
            </BigButton>
          </>
        ) : phase === "reveal" && item && glow ? (
          <>
            <p className={`animate-pop text-3xl font-black ${glow.text}`}>{RARITY_LABEL[item.rarity]}!</p>
            <div className="relative my-5 flex h-48 items-center justify-center">
              {/* 등급 색 빛 */}
              <div
                className="animate-spin-slow absolute h-48 w-48 rounded-full"
                style={{ background: `conic-gradient(from 0deg, transparent, ${glow.ring}, transparent 30%, ${glow.ring}, transparent 60%, ${glow.ring}, transparent)` }}
              />
              <div className={`absolute h-40 w-40 rounded-full bg-radial ${glow.bg} to-transparent blur-xl`} style={{ boxShadow: `0 0 60px ${glow.ring}` }} />
              <Image
                src={itemImage(item.id)}
                alt={item.name}
                width={Math.round((130 * item.w) / item.h)}
                height={130}
                unoptimized
                className="animate-levelup pixelated relative h-[130px] w-auto"
              />
            </div>
            <p className="text-2xl font-extrabold">{item.name}</p>
            <p className="text-sm text-muted">{SLOT_LABEL[item.slot]}</p>
            <div className="mt-5 space-y-2">
              <BigButton onClick={place} disabled={placed} variant={placed ? "secondary" : "primary"}>
                {placed ? "✓ 캐릭터 옆에 놓았어요" : "캐릭터 옆에 놓기"}
              </BigButton>
              {tickets > 0 && (
                <BigButton variant="secondary" onClick={draw}>
                  한 번 더 뽑기 ({tickets}장 남음)
                </BigButton>
              )}
              <BigButton variant="ghost" small onClick={onClose}>
                닫기
              </BigButton>
            </div>
          </>
        ) : (
          <>
            <p className="text-2xl font-extrabold">아이템을 모두 모았어요! 🏆</p>
            <p className="mt-2 text-muted">16개를 전부 모아서 더 뽑을 아이템이 없어요.</p>
            <BigButton className="mt-5" onClick={onClose}>
              닫기
            </BigButton>
          </>
        )}
      </div>
    </div>
  );
}
