// 인식이 불안정할 때 화면을 어둡게 하고 크게 안내한다 (PLAN 작업 9). 판정·경험치는 멈춘다.
import { PAUSE_TEXT } from "@/lib/exercise/rules";

export default function PauseOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 p-6 text-center">
      <p className="text-3xl font-extrabold text-warn">일시 정지</p>
      <p className="text-2xl font-bold">{PAUSE_TEXT}</p>
    </div>
  );
}
