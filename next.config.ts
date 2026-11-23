import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 개발 중 같은 와이파이의 휴대폰에서 접속해 확인할 수 있게 허용 (이 컴퓨터의 내부 IP)
  // IP가 바뀌면 PowerShell에서 ipconfig로 확인해 고친다. 배포에는 영향 없음.
  allowedDevOrigins: ["192.168.0.2"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
