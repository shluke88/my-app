"use client";

// 개발 모드 전용 확인 도구: 아이템을 모두 열어 꾸미기를 바로 확인하거나, 처음 시작 흐름을 다시 볼 수 있다.
// 배포된 앱(production)에서는 보이지 않는다.
import BigButton from "@/components/common/BigButton";
import { ITEMS } from "@/lib/growth/items";
import { loadCharacter, loadSettings, saveCharacter, saveSettings } from "@/lib/storage/localStore";

export default function DevTools() {
  if (process.env.NODE_ENV !== "development") return null;

  const unlockAll = () => {
    const ch = loadCharacter();
    ch.unlockedItemIds = ITEMS.map((i) => i.id);
    saveCharacter(ch);
  };
  const lockAll = () => {
    const ch = loadCharacter();
    ch.unlockedItemIds = [];
    ch.equipped = {};
    saveCharacter(ch);
  };
  const replayOnboarding = () => saveSettings({ ...loadSettings(), acknowledged: false, onboarded: false });

  return (
    <section className="space-y-2 rounded-2xl border border-dashed border-line p-4">
      <h2 className="font-bold text-muted">🛠 개발용 확인 도구 (배포 앱에는 안 보임)</h2>
      <div className="grid grid-cols-2 gap-2">
        <BigButton small variant="secondary" onClick={unlockAll}>
          아이템 모두 열기
        </BigButton>
        <BigButton small variant="ghost" onClick={lockAll}>
          아이템 되돌리기
        </BigButton>
      </div>
      <BigButton small variant="ghost" onClick={replayOnboarding}>
        시작 흐름 다시 보기
      </BigButton>
    </section>
  );
}
