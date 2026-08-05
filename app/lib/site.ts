const baseFromVite = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export const githubPagesBasePath = baseFromVite === "/" ? "" : baseFromVite;

export function normalizeRoutePath(value: string) {
  const withoutQuery = value.split("?")[0]?.split("#")[0] || "/";
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const withoutBase = githubPagesBasePath && withLeadingSlash.startsWith(githubPagesBasePath)
    ? withLeadingSlash.slice(githubPagesBasePath.length) || "/"
    : withLeadingSlash;
  return withoutBase.replace(/\/+$/, "") || "/";
}

export function routeHref(path: string) {
  const normalized = normalizeRoutePath(path);
  return `${githubPagesBasePath}${normalized === "/" ? "/" : normalized}`;
}

export function assetPath(path: string) {
  if (/^(https?:)?\/\//i.test(path)) return path;
  const normalized = path.replace(/^\/+/, "");
  return `${githubPagesBasePath}/${normalized}`;
}

export function routeFromBrowser() {
  if (typeof window === "undefined") return "/";
  const pendingRoute = new URLSearchParams(window.location.search).get("p");
  return normalizeRoutePath(pendingRoute || window.location.pathname);
}

export function restoreFallbackRoute(path: string) {
  if (typeof window === "undefined") return;
  if (!new URLSearchParams(window.location.search).has("p")) return;
  window.history.replaceState({}, "", routeHref(path));
}

export function isSameRoute(currentPath: string, targetPath: string) {
  const current = normalizeRoutePath(currentPath);
  const target = normalizeRoutePath(targetPath);
  return target === "/" ? current === "/" : current === target || current.startsWith(`${target}/`);
}

export function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
