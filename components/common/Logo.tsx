// PoseFit 로고: 사람이 뻗은 모양의 P와 재생 삼각형을 합친 선 그림
export default function Logo({ size = 88 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pf-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9aa6c4" />
          <stop offset="1" stopColor="#1b2547" />
        </linearGradient>
      </defs>
      {/* 머리 */}
      <circle cx="40" cy="14" r="6" stroke="url(#pf-logo)" strokeWidth="5" />
      {/* P의 세로줄 (몸) */}
      <path d="M30 26 L30 84 M38 30 L38 76" stroke="url(#pf-logo)" strokeWidth="5" strokeLinecap="round" />
      {/* P의 고리 + 재생 삼각형 */}
      <path
        d="M30 26 C58 22 82 34 82 50 C82 64 60 70 38 62 L66 46 L38 32"
        stroke="url(#pf-logo)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
