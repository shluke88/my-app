"use client";

// PRD 4번 — 처음 한 번 보여 주는 안전·개인정보 확인 화면
import BigButton from "./BigButton";
import { loadSettings, saveSettings } from "@/lib/storage/localStore";

export default function FirstUseNotice() {
  const accept = () => saveSettings({ ...loadSettings(), acknowledged: true });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="animate-pop w-full max-w-md space-y-4 rounded-3xl bg-surface p-6">
        <h2 className="text-2xl font-extrabold">시작하기 전에</h2>
        <ul className="space-y-3 text-base leading-relaxed">
          <li>
            🔒 카메라 영상은 <b>이 휴대폰 안에서만</b> 분석해요. 녹화·저장·전송하지 않아요.
          </li>
          <li>
            📋 운동 기록과 캐릭터는 <b>이 브라우저에만</b> 저장돼요. 설정에서 언제든 지울 수 있어요.
          </li>
          <li>
            ⚠ PoseFit은 <b>참고용 안내</b>예요. 의학적 판단이 아니며, 통증이 있거나 어지러우면 바로 멈추세요.
          </li>
          <li>🧍 주변을 정리하고 미끄럽지 않은 바닥에서 해 주세요.</li>
        </ul>
        <BigButton onClick={accept}>확인했어요</BigButton>
      </div>
    </div>
  );
}
