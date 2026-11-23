import BigButton from "@/components/common/BigButton";
import PageHeader from "@/components/common/PageHeader";
import SafetyNotice from "@/components/common/SafetyNotice";

// 첫 화면 자리. 공통 틀(작업 1)을 확인하기 위한 임시 화면이며, 작업 4에서 실제 첫 화면으로 바꾼다.
export default function Home() {
  return (
    <>
      <PageHeader title="PoseFit" />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-center text-lg text-muted">스마트폰 세로 화면용 공통 틀</p>
        <BigButton>기본 루틴 시작 ▶</BigButton>
        <BigButton variant="secondary">운동 하나만 하기</BigButton>
        <BigButton variant="ghost" small>
          설정
        </BigButton>
        <div className="mt-auto">
          <SafetyNotice />
        </div>
      </main>
    </>
  );
}
