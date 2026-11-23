import { defineConfig } from "vitest/config";
import path from "node:path";

// 계산 테스트 설정: tests/ 폴더의 테스트를 실행하고, "@/" 경로를 프로젝트 폴더로 연결한다.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
