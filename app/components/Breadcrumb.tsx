"use client";

import { ChevronRight } from "lucide-react";
import { AppLink } from "./AppLink";

type BreadcrumbProps = {
  items: Array<{ label: string; path?: string }>;
  onNavigate: (path: string) => void;
};

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb page-width" aria-label="Điều hướng đường dẫn">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 ? <ChevronRight size={14} aria-hidden="true" /> : null}
          {item.path ? <AppLink to={item.path} onNavigate={onNavigate}>{item.label}</AppLink> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
