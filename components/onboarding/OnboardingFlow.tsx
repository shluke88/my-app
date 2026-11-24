"use client";

// 처음 한 번만 보여 주는 시작 단계: ① 동의 → ② 카메라 테스트 → ③ 신체정보 → ④ 루틴 시작
// 사용자가 준 시작 화면 그림(밝은 바탕, 로고, 동의 카드 2개, 남색 버튼)을 따른다.
import Link from "next/link";
import { useState } from "react";
import BigButton from "@/components/common/BigButton";
import Logo from "@/components/common/Logo";
import CameraCheck from "@/components/workout/CameraCheck";
import { loadSettings, saveSettings } from "@/lib/storage/localStore";
import { EXERCISE_RULES, ROUTINE } from "@/lib/exercise/rules";
import type { Gender } from "@/types";

type Step = "consent" | "camera" | "body" | "start";
const STEPS: Step[] = ["consent", "camera", "body", "start"];

export default function OnboardingFlow() {
  // 동의를 이미 했으면(중간에 나갔다 온 경우) 카메라 테스트부터
  const [step, setStep] = useState<Step>(() => (loadSettings().acknowledged ? "camera" : "consent"));
  const idx = STEPS.indexOf(step);

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {step !== "consent" && (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            className="min-h-11 text-lg text-muted"
            onClick={() => setStep(STEPS[idx - 1])}
            aria-label="이전 단계"
          >
            ←
          </button>
          <div className="flex flex-1 gap-1.5">
            {STEPS.slice(1).map((s, i) => (
              <span key={s} className={`h-1.5 flex-1 rounded-full ${i < idx ? "bg-primary" : "bg-surface-2"}`} />
            ))}
          </div>
          <span className="text-sm text-muted">{idx}/3</span>
        </div>
      )}
      {step === "consent" && <ConsentStep onNext={() => setStep("camera")} />}
      {step === "camera" && <CameraStep onNext={() => setStep("body")} />}
      {step === "body" && <BodyStep onNext={() => setStep("start")} />}
      {step === "start" && <StartStep />}
    </main>
  );
}

/* ① 동의 */
function ConsentStep({ onNext }: { onNext: () => void }) {
  const [privacy, setPrivacy] = useState(false);
  const [safety, setSafety] = useState(false);
  const accept = () => {
    saveSettings({ ...loadSettings(), acknowledged: true });
    onNext();
  };
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col items-center pt-10 text-center">
        <Logo size={96} />
        <h1 className="mt-3 text-5xl font-extrabold tracking-tight">PoseFit</h1>
        <p className="mt-3 text-lg text-muted">반가워요! 당신의 AI 운동 파트너입니다.</p>
      </div>
      <div className="mt-auto space-y-3 pt-10">
        <ConsentCard
          icon="📷"
          title="카메라 개인정보 보호"
          body="모든 카메라 분석은 기기 안에서만 이루어지며, 영상이나 관절 데이터는 외부 서버로 전송되지 않습니다."
          checked={privacy}
          onToggle={() => setPrivacy((v) => !v)}
        />
        <ConsentCard
          icon="⚠️"
          title="안전한 운동 수칙 안내"
          body="본 서비스는 참고용 코칭 도구입니다. 자신의 체력에 맞춰 운동해 주세요. 통증이나 무리가 느껴지면 즉시 운동을 멈춰야 합니다."
          checked={safety}
          onToggle={() => setSafety((v) => !v)}
        />
        <BigButton onClick={accept} disabled={!privacy || !safety} className="mt-2">
          확인하고 시작하기
        </BigButton>
        {(!privacy || !safety) && <p className="text-center text-sm text-muted">두 항목을 눌러 동의해 주세요</p>}
        {/* 홈 화면에 있던 안내 문구를 처음 동의 화면으로 옮겨 작게 보여 준다 */}
        <div className="space-y-0.5 text-center text-xs leading-relaxed text-muted">
          <p>🔒 영상은 이 기기 안에서만 처리되고 저장·전송되지 않습니다.</p>
          <p>⚠ 참고용 안내입니다. 통증이 있으면 바로 멈추세요.</p>
        </div>
        <Link href="/privacy" className="block py-2 text-center text-sm text-muted underline underline-offset-2">
          개인정보 처리방침 및 서비스 이용약관
        </Link>
      </div>
    </div>
  );
}

function ConsentCard(props: { icon: string; title: string; body: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={props.checked}
      onClick={props.onToggle}
      className={`flex w-full items-center gap-3 rounded-3xl border bg-surface/90 p-4 text-left shadow-sm backdrop-blur transition ${
        props.checked ? "border-primary" : "border-line"
      }`}
    >
      <div className="flex-1">
        <p className="text-lg font-extrabold">
          <span className="mr-1.5">{props.icon}</span>
          {props.title}
        </p>
        <p className="mt-1 text-[15px] leading-relaxed text-foreground/85">{props.body}</p>
      </div>
      <div className="flex w-16 flex-col items-center gap-1 text-xs text-muted">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-white transition ${
            props.checked ? "bg-primary" : "bg-surface-2"
          }`}
        >
          ✓
        </span>
        <span className="text-center leading-tight">
          동의함
          <br />
          (필수)
        </span>
      </div>
    </button>
  );
}

/* ② 카메라 테스트 */
function CameraStep({ onNext }: { onNext: () => void }) {
  const [good, setGood] = useState(false);
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h2 className="text-2xl font-extrabold">카메라 테스트</h2>
        <p className="mt-1 text-muted">
          휴대폰을 세워 두고 1~3m 뒤로 서서 머리부터 발끝까지 보이게 해 주세요. 뼈대가 초록색이 되면 준비 끝이에요.
        </p>
      </div>
      <CameraCheck onGoodChange={setGood} />
      <div className="mt-auto space-y-2">
        <BigButton onClick={onNext} variant={good ? "primary" : "secondary"}>
          {good ? "잘 보여요! 다음 ▶" : "다음"}
        </BigButton>
        {!good && <p className="text-center text-sm text-muted">지금 테스트하기 어려우면 다음으로 넘어가도 돼요</p>}
      </div>
    </div>
  );
}

/* ③ 신체정보 (선택) */
function BodyStep({ onNext }: { onNext: () => void }) {
  const saved = loadSettings();
  const [height, setHeight] = useState(saved.heightCm ? String(saved.heightCm) : "");
  const [weight, setWeight] = useState(saved.weightKg ? String(saved.weightKg) : "");
  const [gender, setGender] = useState<Gender | undefined>(saved.gender);
  const h = Number(height);
  const w = Number(weight);
  const heightOk = height === "" || (h >= 100 && h <= 230);
  const weightOk = weight === "" || (w >= 25 && w <= 250);

  const save = (skip: boolean) => {
    const s = loadSettings();
    saveSettings({
      ...s,
      gender: skip ? undefined : gender,
      heightCm: skip || height === "" ? undefined : Math.round(h),
      weightKg: skip || weight === "" ? undefined : Math.round(w * 10) / 10,
    });
    onNext();
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h2 className="text-2xl font-extrabold">신체정보 입력</h2>
        <p className="mt-1 text-muted">선택 사항이에요. 이 기기에만 저장되고, 설정에서 언제든 고치거나 지울 수 있어요.</p>
      </div>
      <GenderField value={gender} onChange={setGender} />
      <NumberField label="키" unit="cm" value={height} onChange={setHeight} ok={heightOk} hint="100~230 사이" />
      <NumberField label="몸무게" unit="kg" value={weight} onChange={setWeight} ok={weightOk} hint="25~250 사이" />
      <div className="mt-auto space-y-2">
        <BigButton onClick={() => save(false)} disabled={!heightOk || !weightOk}>
          저장하고 다음 ▶
        </BigButton>
        <BigButton variant="ghost" small onClick={() => save(true)}>
          건너뛰기
        </BigButton>
      </div>
    </div>
  );
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

/** 성별 고르기 (선택). 같은 버튼을 다시 누르면 선택을 지운다 */
export function GenderField({ value, onChange }: { value?: Gender; onChange: (g: Gender | undefined) => void }) {
  return (
    <div role="radiogroup" aria-label="성별">
      <span className="mb-1 block text-lg font-bold">성별</span>
      <div className="grid grid-cols-2 gap-2">
        {GENDER_OPTIONS.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? undefined : o.value)}
              className={`min-h-14 rounded-2xl border text-xl font-bold transition ${
                on ? "border-primary bg-primary text-primary-ink" : "border-line bg-surface text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function NumberField(props: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  ok: boolean;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-lg font-bold">{props.label}</span>
      <div
        className={`flex items-center rounded-2xl border bg-surface px-4 ${props.ok ? "border-line" : "border-danger"}`}
      >
        <input
          inputMode="decimal"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          className="min-h-14 w-full min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none"
          placeholder="—"
        />
        <span className="text-lg text-muted">{props.unit}</span>
      </div>
      {!props.ok && <span className="mt-1 block text-sm text-danger">{props.hint}로 입력해 주세요</span>}
    </label>
  );
}

/* ④ 루틴 시작 */
function StartStep() {
  const finish = () => saveSettings({ ...loadSettings(), acknowledged: true, onboarded: true });
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="pt-6 text-center">
        <p className="animate-pop text-6xl">🎉</p>
        <h2 className="mt-3 text-3xl font-extrabold">준비 완료!</h2>
        <p className="mt-2 text-muted">첫 루틴으로 몸을 풀어 볼까요?</p>
      </div>
      <ol className="space-y-2 rounded-3xl border border-line bg-surface p-5">
        {ROUTINE.map((id, i) => {
          const r = EXERCISE_RULES[id];
          const target = id === "lunge" ? "한쪽 8회 × 2" : r.measure === "hold" ? `${r.routineTarget}초` : `${r.routineTarget}회`;
          return (
            <li key={id} className="flex items-center justify-between text-lg">
              <span>
                <span className="mr-2 text-muted">{i + 1}</span>
                {r.name}
              </span>
              <span className="font-bold">{target}</span>
            </li>
          );
        })}
        <li className="pt-1 text-sm text-muted">약 7~9분 · 운동 사이 10초 쉬기</li>
      </ol>
      <div className="mt-auto space-y-2">
        <BigButton href="/workout?mode=routine" onClick={finish}>
          루틴 시작 ▶
        </BigButton>
        <BigButton variant="ghost" small onClick={finish}>
          나중에 할게요 (홈으로)
        </BigButton>
      </div>
    </div>
  );
}
