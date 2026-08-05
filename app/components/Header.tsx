"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigation } from "../../data/navigation";
import { isSameRoute } from "../lib/site";
import { trackEvent } from "../lib/tracking";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { AppLink } from "./AppLink";
import { BrandLogo } from "./BrandLogo";

type HeaderProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
};

export function Header({ currentPath, onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeMenu = () => setMenuOpen(false);
  useFocusTrap(menuOpen, drawerRef, closeMenu);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setServicesOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function navigate(path: string) {
    setMenuOpen(false);
    setServicesOpen(false);
    onNavigate(path);
  }

  return (
    <header className="site-header" data-testid="site-header">
      <AppLink className="brand" to="/" onNavigate={navigate} aria-label="Về trang chủ DST Group">
        <BrandLogo priority />
      </AppLink>

      <nav className="desktop-nav" aria-label="Menu chính">
        {navigation.map((item) => {
          const active = isSameRoute(currentPath, item.path);
          if (!item.children) {
            return <AppLink key={item.path} to={item.path} onNavigate={navigate} className={active ? "is-active" : ""}>{item.label}</AppLink>;
          }
          return (
            <div className="service-nav-group" key={item.path} onMouseLeave={() => setServicesOpen(false)}>
              <div className="service-nav-trigger">
                <AppLink to={item.path} onNavigate={navigate} className={active ? "is-active" : ""}>{item.label}</AppLink>
                <button
                  type="button"
                  aria-label="Mở danh sách dịch vụ"
                  aria-expanded={servicesOpen}
                  aria-controls="service-nav-dropdown"
                  onClick={() => setServicesOpen((current) => !current)}
                  onMouseEnter={() => setServicesOpen(true)}
                >
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
              </div>
              <div id="service-nav-dropdown" className={`service-nav-dropdown ${servicesOpen ? "is-open" : ""}`} aria-hidden={!servicesOpen}>
                {item.children.map((child) => (
                  <AppLink key={child.path} to={child.path} onNavigate={navigate}>{child.label}</AppLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <AppLink className="header-cta" to="/lien-he" onNavigate={navigate} onClick={() => trackEvent("cta_consultation", { source: "header" })}>Nhận tư vấn</AppLink>
      <button type="button" className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Mở menu" aria-expanded={menuOpen}>
        <Menu size={22} aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div className="mobile-menu-backdrop" onMouseDown={closeMenu}>
          <aside className="mobile-panel" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Menu điều hướng" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mobile-menu-top">
              <BrandLogo className="mobile-brand-logo" />
              <button type="button" className="icon-button" onClick={closeMenu} aria-label="Đóng menu">
                <X size={21} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Menu trên điện thoại">
              {navigation.map((item) => (
                <div className="mobile-nav-group" key={item.path}>
                  <AppLink to={item.path} onNavigate={navigate} className={isSameRoute(currentPath, item.path) ? "is-active" : ""}>{item.label}</AppLink>
                  {item.children ? (
                    <div className="mobile-service-links">
                      {item.children.map((child) => <AppLink key={child.path} to={child.path} onNavigate={navigate}>{child.label}</AppLink>)}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
            <AppLink className="primary-btn mobile-menu-cta" to="/lien-he" onNavigate={navigate} onClick={() => trackEvent("cta_consultation", { source: "mobile_menu" })}>Nhận tư vấn</AppLink>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
