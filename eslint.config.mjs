import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "docs/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    rules: {
      // 코드 품질 향상을 위한 규칙
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-var": "error",
      // React 관련 규칙
      "react-hooks/exhaustive-deps": "warn",
      // 스크래핑 관련 보안
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
];

export default eslintConfig;
