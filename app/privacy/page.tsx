import type { Metadata } from "next";
import PageHeader from "@/components/common/PageHeader";

export const metadata: Metadata = { title: "개인정보 처리방침 및 이용약관 — PoseFit" };

// 개인정보 처리방침 및 서비스 이용약관 (PRD 7번 보안·개인정보 검토 내용을 쉬운 말로 옮김)
export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="개인정보·이용약관" backHref="/" />
      <main className="space-y-4 px-5 pb-10 text-[15px] leading-relaxed">
        <Section title="1. 카메라 영상">
          카메라 영상은 이 기기의 브라우저 안에서 실시간으로 관절 위치를 찾는 데만 쓰고, 녹화·저장·서버 전송을 하지 않습니다.
          관절 좌표는 운동 중 판정에만 쓰고 운동이 끝나면 메모리에서 사라집니다.
        </Section>
        <Section title="2. 저장하는 정보">
          운동 기록(반복 수, 운동 시간, 안내 횟수), 캐릭터 레벨·아이템, 설정, 그리고 직접 입력한 경우의 성별·키·몸무게를 이 기기의
          브라우저에만 저장합니다. 서버나 다른 사람에게 보내지 않습니다.
        </Section>
        <Section title="3. 삭제">
          설정 → &ldquo;모든 기록 삭제&rdquo;로 언제든 지울 수 있습니다. 성별·키·몸무게는 설정의 신체정보에서 따로 지울 수 있습니다.
          브라우저 데이터를 지우거나 기기를 바꾸면 기록이 사라질 수 있습니다.
        </Section>
        <Section title="4. 서비스 성격">
          PoseFit은 참고용 운동 코칭 도구이며 의학적 진단이나 치료, 부상 예방을 보장하지 않습니다. 통증이나 무리가 느껴지면 즉시
          운동을 멈추세요. 로그인, 결제, 광고, 외부 분석 도구를 쓰지 않습니다.
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-1 text-lg font-bold">{title}</h2>
      <p className="text-foreground/85">{children}</p>
    </section>
  );
}
