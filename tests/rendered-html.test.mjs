import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../outputs/gh-pages-dist/", import.meta.url);

async function outputFile(relativePath) {
  return readFile(new URL(relativePath, outputRoot), "utf8");
}

test("exports every required public route with individual metadata", async () => {
  const routes = [
    "index.html",
    "gioi-thieu/index.html",
    "dich-vu/index.html",
    "dich-vu/marketing/index.html",
    "dich-vu/media/index.html",
    "dich-vu/branding/index.html",
    "dich-vu/thiet-ke-website/index.html",
    "dich-vu/truyen-thong/index.html",
    "dich-vu/to-chuc-su-kien/index.html",
    "du-an/index.html",
    "tin-tuc/index.html",
    "tuyen-dung/index.html",
    "lien-he/index.html",
    "chinh-sach-bao-mat/index.html",
    "dieu-khoan-su-dung/index.html",
  ];

  await Promise.all(routes.map((route) => access(new URL(route, outputRoot))));
  const [home, marketing, article] = await Promise.all([
    outputFile("index.html"),
    outputFile("dich-vu/marketing/index.html"),
    outputFile("tin-tuc/xay-dung-ke-hoach-marketing-tu-muc-tieu-kinh-doanh/index.html"),
  ]);

  assert.match(home, /<meta charset="UTF-8"/i);
  assert.match(home, /DST Group \| Marketing, Media &amp; Branding/);
  assert.match(marketing, /Marketing &amp; Quảng cáo/);
  assert.match(article, /Xây dựng kế hoạch marketing/);
});

test("keeps GitHub Pages base paths, fallback routing, SEO files, and no frontend secret", async () => {
  const [viteConfig, fallback, robots, sitemap, chatSource, conversationSource, staticIndex] = await Promise.all([
    readFile(new URL("../gh-pages-static/vite.config.mjs", import.meta.url), "utf8"),
    outputFile("404.html"),
    outputFile("robots.txt"),
    outputFile("sitemap.xml"),
    readFile(new URL("../app/AiConsultantChat.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/dst-conversation.ts", import.meta.url), "utf8"),
    readFile(new URL("../gh-pages-static/index.html", import.meta.url), "utf8"),
  ]);

  assert.match(viteConfig, /base:\s*["']\/websiteDST-ai-chat\/["']/);
  assert.match(fallback, /\?p=/);
  assert.match(robots, /websiteDST-ai-chat\/sitemap\.xml/);
  assert.match(sitemap, /dich-vu\/marketing/);
  assert.match(chatSource, /pageContext/);
  // Lich su that nam tren may chu (KV). Trinh duyet chi giu ma phien, va viec do
  // thuoc lop dst-conversation chu khong con nam trong component giao dien.
  assert.match(chatSource, /conversationId/);
  assert.doesNotMatch(chatSource, /localStorage/);
  assert.match(conversationSource, /localStorage/);
  assert.match(conversationSource, /\/api\/web-chat/);
  assert.match(conversationSource, /\/api\/web-history/);
  assert.doesNotMatch(chatSource, /OPENAI_API_KEY|GEMINI_API_KEY/);
  assert.doesNotMatch(conversationSource, /OPENAI_API_KEY|GEMINI_API_KEY|ADMIN_PASSWORD|META_/);
  assert.doesNotMatch(staticIndex, /api[_-]?key\s*[:=]\s*["'][^"']+/i);
});

test("bang gia chi la tham khao thi truong, khong duoc trinh bay nhu bao gia DST", async () => {
  const [pricingSource, knowledgeSource] = await Promise.all([
    readFile(new URL("../data/pricing.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/dst-knowledge.ts", import.meta.url), "utf8"),
  ]);

  // Con so trong bang la khao sat thi truong, chua duoc DST duyet lam bao gia.
  assert.match(pricingSource, /isOfficialDstPricing = false/);
  assert.match(pricingSource, /KHONG phai bao gia cua DST/);
  // Prompt phai bat bot noi ro nguon goc con so va cam bia them.
  assert.match(knowledgeSource, /KHOANG GIA THAM KHAO CUA THI TRUONG/);
  assert.match(knowledgeSource, /khong phai bao gia cua DST/i);
  assert.match(knowledgeSource, /TUYET DOI khong tu bia con so ngoai bang tren/);
});
