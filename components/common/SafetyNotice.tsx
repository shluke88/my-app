// Design Ref: §5.4 — 첫 화면 필수 문구: 영상은 기기 안에서만 처리, 참고용 안내
export default function SafetyNotice() {
  return (
    <div className="space-y-2 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-muted">
      <p>🔒 영상은 이 기기 안에서만 처리되고 저장·전송되지 않습니다.</p>
      <p>⚠ 참고용 안내입니다. 통증이 있으면 바로 멈추세요.</p>
    </div>
  );
}
