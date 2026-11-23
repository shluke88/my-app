"use client";

// 브라우저 저장소의 캐릭터·설정을 화면에서 읽고, 바뀌면 다시 그리게 하는 훅
import { useMemo, useSyncExternalStore } from "react";
import {
  createDefaultCharacter,
  createDefaultSettings,
  loadCharacter,
  loadSettings,
  readRaw,
  STORE_EVENT,
  STORE_KEYS,
} from "@/lib/storage/localStore";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORE_EVENT, onChange);
  };
}

/** 서버에서 그릴 때는 "아직 모름"(undefined)을 돌려준다 */
function useRaw(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => undefined,
  );
}

/** 저장된 캐릭터. 브라우저에서 읽기 전에는 ready=false */
export function useCharacter() {
  const raw = useRaw(STORE_KEYS.character);
  const character = useMemo(() => (raw === undefined ? createDefaultCharacter() : loadCharacter()), [raw]);
  return { character, ready: raw !== undefined };
}

export function useSettings() {
  const raw = useRaw(STORE_KEYS.settings);
  const settings = useMemo(() => (raw === undefined ? createDefaultSettings() : loadSettings()), [raw]);
  return { settings, ready: raw !== undefined };
}
