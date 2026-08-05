import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const LOCAL_DEVELOPMENT_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

/**
 * Kho hoi thoai dung Cloudflare KV.
 *
 * O local, plugin Cloudflare chay miniflare va cap mot KV that, luu xuong
 * `.wrangler/state`, nen hop thu quan tri co du lieu ben vung giua cac lan khoi dong
 * ma khong phai muon localStorage. `id` chi la nhan cho ban local; khi len that thi
 * thay bang id namespace do Cloudflare cap, ma nguon khong doi.
 */
const CONVERSATION_KV = {
  binding: "CONVERSATIONS",
  id: "dst_conversations_local",
};

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  kv_namespaces: [CONVERSATION_KV],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: LOCAL_DEVELOPMENT_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

/**
 * Bien moi truong day vao Worker.
 *
 * Khong ten nao co tien to `VITE_`, nen Vite khong nhung chung vao bundle trinh duyet
 * — khoa va mat khau chi ton tai phia server. Chi liet ke dung nhung ten can dung; do
 * ca `.env.local` vao se vo tinh day moi bien may cuc bo len Worker.
 */
const SERVER_ENV_KEYS = [
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "DST_BOT_URL",
  "ADMIN_PASSWORD",
  "MESSENGER_WORKER_URL",
  "MESSENGER_ADMIN_TOKEN",
  "META_PAGE_ACCESS_TOKEN",
  "META_APP_SECRET",
  "META_VERIFY_TOKEN",
] as const;

function serverVars(mode: string): Record<string, string> {
  const env = loadEnv(mode, process.cwd(), "");
  const vars: Record<string, string> = {};
  for (const key of SERVER_ENV_KEYS) {
    if (env[key]) vars[key] = env[key];
  }
  return vars;
}

export default defineConfig(async ({ mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: { ...localBindingConfig, vars: serverVars(mode) },
      }),
    ],
  };
});
