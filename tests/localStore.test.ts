import { describe, expect, it } from "vitest";
import {
  addSession,
  clearAll,
  createDefaultCharacter,
  isStorageAvailable,
  loadCharacter,
  loadSessions,
  loadSettings,
  saveCharacter,
  saveSettings,
  type KeyValueStore,
} from "@/lib/storage/localStore";
import type { SessionRecord } from "@/types";

function fakeStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const session = (id: string): SessionRecord => ({
  id,
  startedAt: "2026-11-24T00:00:00Z",
  mode: "single",
  durationSec: 60,
  exercises: [],
  newItemIds: [],
});

// 작업 3: 브라우저 저장 모듈
describe("브라우저 저장 모듈", () => {
  it("저장한 캐릭터를 다시 읽는다", () => {
    const s = fakeStore();
    const c = createDefaultCharacter();
    c.parts.lower = { level: 7, xp: 30 };
    c.unlockedItemIds = ["hat-red-cap"];
    c.equipped = { hat: "hat-red-cap" };
    saveCharacter(c, s);
    const loaded = loadCharacter(s);
    expect(loaded.parts.lower).toEqual({ level: 7, xp: 30 });
    expect(loaded.equipped.hat).toBe("hat-red-cap");
  });

  it("없거나 깨진 데이터는 기본값", () => {
    const s = fakeStore();
    expect(loadCharacter(s).parts.core).toEqual({ level: 1, xp: 0 });
    s.setItem("posefit:character", "{깨짐");
    expect(loadCharacter(s).parts.core).toEqual({ level: 1, xp: 0 });
    expect(loadCharacter(null).parts.upper.level).toBe(1);
  });

  it("세션은 최근 30개만 보관", () => {
    const s = fakeStore();
    for (let i = 0; i < 35; i++) addSession(session(`s${i}`), s);
    const list = loadSessions(s);
    expect(list).toHaveLength(30);
    expect(list[0].id).toBe("s34");
  });

  it("설정 저장과 전체 삭제", () => {
    const s = fakeStore();
    expect(loadSettings(s).voiceOn).toBe(true);
    saveSettings({ version: 1, voiceOn: false, acknowledged: true, onboarded: true, heightCm: 172, weightKg: 68 }, s);
    expect(loadSettings(s).voiceOn).toBe(false);
    expect(loadSettings(s).heightCm).toBe(172);
    addSession(session("a"), s);
    clearAll(s);
    expect(loadSessions(s)).toEqual([]);
    expect(loadSettings(s).acknowledged).toBe(false);
  });

  it("쓰기가 막힌 저장소는 사용 불가로 본다", () => {
    const blocked: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {},
    };
    expect(isStorageAvailable(blocked)).toBe(false);
    expect(isStorageAvailable(fakeStore())).toBe(true);
    expect(saveCharacter(createDefaultCharacter(), blocked)).toBe(false);
  });
});
