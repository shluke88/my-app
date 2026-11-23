import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 외부에서 받은 자세 인식 실행 파일과 삭제 대기 폴더는 검사하지 않는다
    "public/mediapipe/**",
    "trash-can/**",
  ]),
]);

export default eslintConfig;
