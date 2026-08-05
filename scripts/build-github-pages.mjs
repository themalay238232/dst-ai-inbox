import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "outputs", "gh-pages-dist");
const repoBasePath = "/websiteDST-ai-chat";
const siteUrl = `https://theluc205.github.io${repoBasePath}`;
const routeMeta = JSON.parse(await readFile(path.join(root, "data", "seo.json"), "utf8"));
const indexPath = path.join(outputDir, "index.html");
const sourceHtml = await readFile(indexPath, "utf8");

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function routeUrl(route) {
  return `${siteUrl}${route === "/" ? "/" : route}`;
}

function replaceTag(html, expression, replacement) {
  return expression.test(html) ? html.replace(expression, replacement) : html;
}

function htmlForRoute(route, meta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = routeUrl(route);
  let html = sourceHtml;
  html = replaceTag(html, /<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  html = replaceTag(html, /<meta name="description" content="[^"]*"\s*\/>/i, `<meta name="description" content="${description}" />`);
  html = replaceTag(html, /<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${canonical}" />`);
  html = replaceTag(html, /<meta property="og:title" content="[^"]*"\s*\/>/i, `<meta property="og:title" content="${title}" />`);
  html = replaceTag(html, /<meta property="og:description" content="[^"]*"\s*\/>/i, `<meta property="og:description" content="${description}" />`);
  html = replaceTag(html, /<meta property="og:url" content="[^"]*"\s*\/>/i, `<meta property="og:url" content="${canonical}" />`);
  html = replaceTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/>/i, `<meta name="twitter:title" content="${title}" />`);
  html = replaceTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/>/i, `<meta name="twitter:description" content="${description}" />`);
  return html;
}

for (const [route, meta] of Object.entries(routeMeta)) {
  const html = htmlForRoute(route, meta);
  const filePath = route === "/"
    ? indexPath
    : path.join(outputDir, route.replace(/^\//, ""), "index.html");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, html, "utf8");
}

const fallback = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>DST Group</title><script>(function(){var base="${repoBasePath}/";var path=window.location.pathname;var target=path.indexOf("${repoBasePath}")===0?path.slice("${repoBasePath}".length)||"/":path||"/";window.location.replace(base+"?p="+encodeURIComponent(target+window.location.search+window.location.hash));}());</script></head><body></body></html>`;
await writeFile(path.join(outputDir, "404.html"), fallback, "utf8");

const sitemapUrls = Object.keys(routeMeta)
  .map((route) => `<url><loc>${routeUrl(route)}</loc></url>`)
  .join("");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls}</urlset>`;
await writeFile(path.join(outputDir, "sitemap.xml"), sitemap, "utf8");
await writeFile(path.join(outputDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`, "utf8");
await writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");

console.log(`Prepared ${Object.keys(routeMeta).length} static routes for GitHub Pages.`);
