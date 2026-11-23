import type { Metadata } from "next";
import PageHeader from "@/components/common/PageHeader";
import CameraCheck from "@/components/workout/CameraCheck";

export const metadata: Metadata = { title: "카메라 테스트 — PoseFit" };

// 설정에서 들어오는 카메라 테스트 다시 하기 화면
export default function CameraTestPage() {
  return (
    <>
      <PageHeader title="카메라 테스트" backHref="/settings" />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <p className="text-muted">
          휴대폰을 세워 두고 1~3m 뒤로 서서 머리부터 발끝까지 보이게 해 주세요. 뼈대가 초록색이 되면 잘 보이는 거예요.
        </p>
        <CameraCheck />
      </main>
    </>
  );
}
