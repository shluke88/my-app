// Design Ref: §3 — 브라우저 저장소(localStorage) 읽기·쓰기·전체 삭제.
// 서버로 보내지 않고 이 기기에만 저장한다. 비공개 모드 등으로 저장소를 못 쓰면 조용히 넘어간다.
import type { BodyPart, CharacterState, SessionRecord, Settings } from "@/types";
import { BODY_PARTS, MAX_SESSIONS } from "@/lib/growth/config";
import { ITEM_BY_ID } from "@/lib/growth/items";

export const STORAGE_VERSION = 1;
const KEY_CHARACTER = "posefit:character";
const KEY_SESSIONS = "posefit:sessions";
const KEY_SETTINGS = "posefit:settings";
const ALL_KEYS = [KEY_CHARACTER, KEY_SESSIONS, KEY_SETTINGS];

/** 테스트에서 가짜 저장소를 넣을 수 있게 저장소 모양만 정의한다 */
export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStore(): KeyValueStore | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 저장소를 실제로 쓸 수 있는지 (비공개 모드에서는 쓰기가 막힐 수 있다) */
export function isStorageAvailable(store: KeyValueStore | null = defaultStore()): boolean {
  if (!store) return false;
  try {
    store.setItem("posefit:probe", "1");
    store.removeItem("posefit:probe");
    return true;
  } catch {
    return false;
  }
}

/** 같은 탭 안의 화면들이 저장 변경을 알 수 있게 알린다 */
export const STORE_EVENT = "posefit-store";
function notifyChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STORE_EVENT));
}

/** 저장 값의 원본 글자를 읽는다 (화면에서 변경 감지용) */
export function readRaw(key: string): string | null {
  const store = defaultStore();
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export const STORE_KEYS = { character: KEY_CHARACTER, sessions: KEY_SESSIONS, settings: KEY_SETTINGS } as const;

function readJson<T>(key: string, store: KeyValueStore | null): T | null {
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown, store: KeyValueStore | null): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    notifyChange();
    return true;
  } catch {
    return false;
  }
}

export function createDefaultCharacter(): CharacterState {
  const parts = Object.fromEntries(BODY_PARTS.map((p) => [p, { level: 1, xp: 0 }])) as Record<
    BodyPart,
    { level: number; xp: number }
  >;
  return { version: STORAGE_VERSION, parts, unlockedItemIds: [], drawTickets: 0, equipped: {}, updatedAt: new Date(0).toISOString() };
}

export function createDefaultSettings(): Settings {
  return { version: STORAGE_VERSION, voiceOn: true, acknowledged: false, onboarded: false };
}

export function loadCharacter(store = defaultStore()): CharacterState {
  const saved = readJson<CharacterState>(KEY_CHARACTER, store);
  if (!saved || saved.version !== STORAGE_VERSION || !saved.parts) return createDefaultCharacter();
  // 빠진 부위가 있으면 기본값으로 채운다
  const base = createDefaultCharacter();
  // 아이템 목록이 바뀌어도 깨지지 않게, 지금 목록에 있는 아이템만 남긴다
  const unlockedItemIds = (saved.unlockedItemIds ?? []).filter((id) => ITEM_BY_ID[id]);
  const equipped: CharacterState["equipped"] = {};
  for (const [slot, id] of Object.entries(saved.equipped ?? {})) {
    const item = id ? ITEM_BY_ID[id] : undefined;
    if (item && item.slot === slot && unlockedItemIds.includes(id)) equipped[item.slot] = id;
  }
  return { ...base, ...saved, parts: { ...base.parts, ...saved.parts }, unlockedItemIds, equipped };
}

export function saveCharacter(state: CharacterState, store = defaultStore()): boolean {
  return writeJson(KEY_CHARACTER, { ...state, version: STORAGE_VERSION, updatedAt: new Date().toISOString() }, store);
}

export function loadSessions(store = defaultStore()): SessionRecord[] {
  const saved = readJson<SessionRecord[]>(KEY_SESSIONS, store);
  return Array.isArray(saved) ? saved : [];
}

/** 세션을 맨 앞에 넣고 최근 30개만 남긴다 */
export function addSession(record: SessionRecord, store = defaultStore()): boolean {
  const list = [record, ...loadSessions(store).filter((s) => s.id !== record.id)].slice(0, MAX_SESSIONS);
  return writeJson(KEY_SESSIONS, list, store);
}

export function loadSettings(store = defaultStore()): Settings {
  const saved = readJson<Settings>(KEY_SETTINGS, store);
  return { ...createDefaultSettings(), ...(saved ?? {}), version: STORAGE_VERSION };
}

export function saveSettings(settings: Settings, store = defaultStore()): boolean {
  return writeJson(KEY_SETTINGS, settings, store);
}

/** 모든 기록 삭제 (캐릭터·세션·설정) */
export function clearAll(store = defaultStore()): void {
  if (!store) return;
  for (const key of ALL_KEYS) {
    try {
      store.removeItem(key);
    } catch {
      // 지울 수 없으면 넘어간다
    }
  }
  notifyChange();
}
