"use client";

// 개발 모드 전용 테스트 영상 입력 (PLAN 작업 9·11). 배포된 앱(production)에서는 보이지 않는다.
interface Props {
  onFile: (file: File) => void;
}

export default function DevVideoInput({ onFile }: Props) {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <label className="block rounded-xl border border-dashed border-surface-2 p-3 text-sm text-muted">
      🛠 개발용: 테스트 영상으로 확인하기
      <input
        type="file"
        accept="video/*"
        className="mt-2 block w-full text-xs"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </label>
  );
}
