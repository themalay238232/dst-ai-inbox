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
  // Namespace that tren tai khoan Cloudflare. O local, plugin dung KV mo phong theo
  // ten binding nen id nay khong anh huong gi; khi deploy thi phai la id that.
  id: "8d81596c470148e3b7a6922077d6cd6a",
};

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  kv_namespaces: [CONVERSATION_KV],
  // Workers AI. Bat buoc cho ban deploy: Gemini tu choi request tu edge cua
  // Cloudflare ("User location is not supported"), con Workers AI thi khong.
  ai: { binding: "AI" },
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
  "WORKERS_AI_MODEL",
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

export default defineConfig(async ({ command, mode }) => {
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
        // CHI nap `.env.local` khi chay dev. Luc build de deploy thi khong duoc:
        // `vars` di thang vao cau hinh Worker duoi dang bien THUONG, tuc khoa va mat
        // khau se hien ro trong dashboard Cloudflare va nam trong dist/ tren dia.
        // Tren ban deploy, dung `wrangler secret put` de chung la secret that.
        // Service binding sang worker Messenger CHI dat o ban deploy: Cloudflare chan
        // Worker goi HTTP sang Worker khac cung zone (error 1042). O local thi nguoc
        // lai — khai binding nay se lam miniflare di tim mot worker cuc bo khong ton
        // tai, nen local van goi HTTP thuong.
        config: command === "serve"
          ? { ...localBindingConfig, vars: serverVars(mode) }
          : {
            ...localBindingConfig,
            services: [{ binding: "MESSENGER", service: "dst-group-messenger-ai" }],
          },
      }),
    ],
  };
});
