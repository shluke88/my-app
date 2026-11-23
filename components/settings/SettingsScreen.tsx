"use client";

// Design Ref: §5.1 ④ 설정 화면 — 음성 안내 켜기·끄기, 저장 안내, 모든 기록 삭제(한 번 더 확인)
import { useState } from "react";
import BigButton from "@/components/common/BigButton";
import PageHeader from "@/components/common/PageHeader";
import { useSettings } from "@/hooks/useStored";
import { clearAll, isStorageAvailable, loadSettings, saveSettings } from "@/lib/storage/localStore";
import { GenderField, NumberField } from "@/components/onboarding/OnboardingFlow";
import DevTools from "./DevTools";
import type { Gender } from "@/types";

/** 키·몸무게 고치기·지우기 (선택 입력, 이 기기에만 저장) */
function BodyInfoEditor() {
  const saved = loadSettings();
  const [height, setHeight] = useState(saved.heightCm ? String(saved.heightCm) : "");
  const [weight, setWeight] = useState(saved.weightKg ? String(saved.weightKg) : "");
  const [gender, setGender] = useState<Gender | undefined>(saved.gender);
  const h = Number(height);
  const w = Number(weight);
  const heightOk = height === "" || (h >= 100 && h <= 230);
  const weightOk = weight === "" || (w >= 25 && w <= 250);
  const changed = gender !== saved.gender || height !== (saved.heightCm ? String(saved.heightCm) : "") || weight !== (saved.weightKg ? String(saved.weightKg) : "");

  const save = (clear: boolean) =>
    saveSettings({
      ...loadSettings(),
      gender: clear ? undefined : gender,
      heightCm: clear || height === "" ? undefined : Math.round(h),
      weightKg: clear || weight === "" ? undefined : Math.round(w * 10) / 10,
    });

  return (
    <section className="space-y-3 rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-xl font-bold">신체정보 (선택)</h2>
      <GenderField value={gender} onChange={setGender} />
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="키" unit="cm" value={height} onChange={setHeight} ok={heightOk} hint="100~230 사이" />
        <NumberField label="몸무게" unit="kg" value={weight} onChange={setWeight} ok={weightOk} hint="25~250 사이" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <BigButton small variant="ghost" onClick={() => save(true)} disabled={!saved.heightCm && !saved.weightKg && !saved.gender}>
          지우기
        </BigButton>
        <BigButton small onClick={() => save(false)} disabled={!changed || !heightOk || !weightOk}>
          저장
        </BigButton>
      </div>
    </section>
  );
}

export default function SettingsScreen() {
  const { settings, ready } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const toggleVoice = () => saveSettings({ ...settings, voiceOn: !settings.voiceOn });
  const deleteAll = () => {
    // 확인 화면을 다시 띄우지 않도록 "확인했어요"는 유지하고 나머지를 지운다
    clearAll();
    saveSettings({ version: settings.version, voiceOn: true, acknowledged: true, onboarded: true });
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
          className="flex min-h-16 items-center justify-between rounded-2xl border border-line bg-surface px-5 text-xl font-bold"
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

        {ready && <BodyInfoEditor key={`${settings.gender}-${settings.heightCm}-${settings.weightKg}`} />}

        <BigButton href="/camera-test" variant="secondary">
          📷 카메라 테스트 다시 하기
        </BigButton>

        <div className="rounded-2xl border border-line bg-surface p-5 text-base leading-relaxed text-muted">
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
        <DevTools />
      </main>
    </>
  );
}
