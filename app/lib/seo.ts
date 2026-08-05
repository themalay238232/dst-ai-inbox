"use client";

import { useEffect } from "react";
import routeMeta from "../../data/seo.json";
import { company } from "../../data/company";
import { hasConfiguredValue } from "../../data/companyConfig";
import { routeHref } from "./site";

type RouteMeta = { title: string; description: string };

const metadata = routeMeta as Record<string, RouteMeta>;

function absoluteUrl(path: string) {
  const relative = routeHref(path);
  if (typeof window !== "undefined") return new URL(relative, window.location.origin).toString();
  return `https://theluc205.github.io${relative}`;
}

function setMeta(selector: string, attributes: Record<string, string>) {
  const element = document.head.querySelector<HTMLMetaElement>(selector) || document.createElement("meta");
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  if (!element.parentNode) document.head.appendChild(element);
}

function setCanonical(href: string) {
  const element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]') || document.createElement("link");
  element.rel = "canonical";
  element.href = href;
  if (!element.parentNode) document.head.appendChild(element);
}

export function pageMetaFor(path: string): RouteMeta {
  return metadata[path] || metadata["/"];
}

export function organizationSchema() {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/assets/logo-dst-group.png"),
    slogan: company.slogan,
  };
  if (hasConfiguredValue(company.legalName)) schema.alternateName = company.legalName;
  if (hasConfiguredValue(company.phoneDisplay || company.phone)) schema.telephone = company.phoneDisplay || company.phone;
  if (hasConfiguredValue(company.email)) schema.email = company.email;
  return schema;
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function usePageMetadata(path: string, schema?: Record<string, unknown> | Array<Record<string, unknown>>) {
  useEffect(() => {
    const meta = pageMetaFor(path);
    const canonical = absoluteUrl(path);
    document.title = meta.title;
    setMeta('meta[name="description"]', { name: "description", content: meta.description });
    setMeta('meta[property="og:title"]', { property: "og:title", content: meta.title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: meta.description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    setMeta('meta[property="og:image"]', { property: "og:image", content: absoluteUrl("/og.png") });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: meta.title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: meta.description });
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: absoluteUrl("/og.png") });
    setCanonical(canonical);

    const jsonLd = document.getElementById("dst-route-jsonld") || document.createElement("script");
    jsonLd.id = "dst-route-jsonld";
    jsonLd.setAttribute("type", "application/ld+json");
    jsonLd.textContent = JSON.stringify([organizationSchema(), ...(schema ? (Array.isArray(schema) ? schema : [schema]) : [])]);
    if (!jsonLd.parentNode) document.head.appendChild(jsonLd);
  }, [path, schema]);
}
