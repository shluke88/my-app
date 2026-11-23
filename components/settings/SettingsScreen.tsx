"use client";

// Design Ref: §5.1 ④ 설정 화면 — 음성 안내 켜기·끄기, 저장 안내, 모든 기록 삭제(한 번 더 확인)
import { useState } from "react";
import BigButton from "@/components/common/BigButton";
import PageHeader from "@/components/common/PageHeader";
import { useSettings } from "@/hooks/useStored";
import { clearAll, isStorageAvailable, saveSettings } from "@/lib/storage/localStore";

export default function SettingsScreen() {
  const { settings, ready } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const toggleVoice = () => saveSettings({ ...settings, voiceOn: !settings.voiceOn });
  const deleteAll = () => {
    // 확인 화면을 다시 띄우지 않도록 "확인했어요"는 유지하고 나머지를 지운다
    clearAll();
    saveSettings({ ...settings, voiceOn: true, acknowledged: true });
    setConfirming(false);
    setDeleted(true);
  };

  return (
    <>
      <PageHeader title="설정" backHref="/" />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <button
          type="button"
          role="switch"
          aria-checked={settings.voiceOn}
          onClick={toggleVoice}
          className="flex min-h-16 items-center justify-between rounded-2xl bg-surface px-5 text-xl font-bold"
        >
          <span>음성 안내</span>
          <span
            className={`flex h-9 w-16 items-center rounded-full p-1 transition ${settings.voiceOn ? "bg-accent" : "bg-surface-2"}`}
          >
            <span className={`h-7 w-7 rounded-full bg-white transition ${settings.voiceOn ? "translate-x-7" : ""}`} />
          </span>
        </button>
        <p className="-mt-2 px-1 text-sm text-muted">
          {settings.voiceOn ? "켜짐 — 브라우저 기본 음성으로 짧게 안내해요." : "꺼짐 — 화면 메시지로만 안내해요."}
        </p>

        <div className="rounded-2xl bg-surface p-5 text-base leading-relaxed text-muted">
          내 기록은 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 기기를 바꾸면 사라질 수 있어요.
          {ready && !isStorageAvailable() && (
            <p className="mt-2 font-bold text-warn">지금은 저장소를 쓸 수 없어 기록이 저장되지 않아요. (비공개 모드 등)</p>
          )}
        </div>

        {!confirming ? (
          <BigButton variant="danger" onClick={() => setConfirming(true)}>
            모든 기록 삭제
          </BigButton>
        ) : (
          <div className="animate-pop space-y-3 rounded-2xl border-2 border-danger p-4">
            <p className="text-lg font-bold">캐릭터 레벨, 아이템, 운동 기록이 모두 지워져요. 되돌릴 수 없어요.</p>
            <div className="grid grid-cols-2 gap-2">
              <BigButton variant="secondary" small onClick={() => setConfirming(false)}>
                취소
              </BigButton>
              <BigButton variant="danger" small onClick={deleteAll}>
                삭제
              </BigButton>
            </div>
          </div>
        )}
        {deleted && <p className="text-center text-accent">모든 기록을 지웠어요.</p>}
      </main>
    </>
  );
}
