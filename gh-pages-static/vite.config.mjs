import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  base: "/websiteDST-ai-chat/",
  plugins: [react()],
  publicDir: path.resolve(import.meta.dirname, "../public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "../outputs/gh-pages-dist"),
    emptyOutDir: true,
  },
});
