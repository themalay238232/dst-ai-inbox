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
    "outputs/**",
    "dist/**",
    ".vinext/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["app/**/*.tsx", "gh-pages-static/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["app/layout.tsx"],
    rules: {
      "@next/next/no-page-custom-font": "off",
    },
  },
]);

export default eslintConfig;
