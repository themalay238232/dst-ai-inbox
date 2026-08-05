"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { routeHref } from "../lib/site";

type AppLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  onNavigate?: (path: string) => void;
};

export function AppLink({ to, onNavigate, onClick, children, ...props }: AppLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate?.(to);
  }

  return (
    <a href={routeHref(to)} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
