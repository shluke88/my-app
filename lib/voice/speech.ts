// 브라우저 기본 음성으로 짧게 말하기 (PLAN 작업 13). 외부 음성 서비스는 쓰지 않는다.
// 언제 말할지(반복당 1번, 3초 중복 방지)는 cueFilter가 정하고, 여기서는 말하기만 한다.

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 휴대폰은 사용자가 버튼을 눌러야 소리를 낼 수 있어서, "소리 켜고 시작"을 누를 때 한 번 깨운다 */
export function unlockSpeech(): void {
  if (!isSpeechSupported()) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    // 지원하지 않으면 화면 안내만 쓴다
  }
}

export function speak(text: string): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel(); // 밀린 말은 버리고 지금 것만
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    // 무시
  }
}

export function stopSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
