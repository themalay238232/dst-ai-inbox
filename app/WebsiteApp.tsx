"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { findArticle } from "../data/articles";
import { findProject } from "../data/projects";
import { findService } from "../data/services";
import { AiConsultantChat } from "./AiConsultantChat";
import { FloatingContactButtons } from "./components/FloatingContactButtons";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { breadcrumbSchema, usePageMetadata } from "./lib/seo";
import { normalizeRoutePath, restoreFallbackRoute, routeFromBrowser, routeHref } from "./lib/site";
import { AboutPage } from "./pages/AboutPage";
import { ArticlePage } from "./pages/ArticlePage";
import { CareersPage } from "./pages/CareersPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { InboxPage } from "./pages/InboxPage";
import { LegalPage } from "./pages/LegalPage";
import { NewsPage } from "./pages/NewsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ServiceDetailPage } from "./pages/ServiceDetailPage";
import { ServicesPage } from "./pages/ServicesPage";

type WebsiteAppProps = { initialPath?: string };

function routeSchema(path: string) {
  const crumbs = [{ name: "Trang chủ", path: "/" }];
  const service = path.startsWith("/dich-vu/") ? findService(path.split("/").pop() || "") : undefined;
  const project = path.startsWith("/du-an/") ? findProject(path.split("/").pop() || "") : undefined;
  const article = path.startsWith("/tin-tuc/") ? findArticle(path.split("/").pop() || "") : undefined;
  if (service) {
    crumbs.push({ name: "Dịch vụ", path: "/dich-vu" }, { name: service.title, path });
    return [
      breadcrumbSchema(crumbs),
      { "@context": "https://schema.org", "@type": "Service", name: service.title, description: service.summary, serviceType: service.title },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: service.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) },
    ];
  }
  if (project) {
    crumbs.push({ name: "Dự án", path: "/du-an" }, { name: project.title, path });
    return breadcrumbSchema(crumbs);
  }
  if (article) {
    crumbs.push({ name: "Tin tức", path: "/tin-tuc" }, { name: article.title, path });
    return [
      breadcrumbSchema(crumbs),
      { "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, datePublished: article.publishedAt, inLanguage: "vi" },
    ];
  }
  return undefined;
}

export function WebsiteApp({ initialPath }: WebsiteAppProps) {
  const [currentPath, setCurrentPath] = useState(() => normalizeRoutePath(initialPath || routeFromBrowser()));
  const [chatToken, setChatToken] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const schema = useMemo(() => routeSchema(currentPath), [currentPath]);
  usePageMetadata(currentPath, schema);

  useEffect(() => {
    const fromBrowser = routeFromBrowser();
    restoreFallbackRoute(fromBrowser);
    const onPopState = () => setCurrentPath(routeFromBrowser());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentPath]);

  function navigate(path: string) {
    const target = normalizeRoutePath(path);
    if (window.location.pathname !== routeHref(target)) {
      window.history.pushState({}, "", routeHref(target));
    }
    setCurrentPath(target);
    window.setTimeout(() => mainRef.current?.focus({ preventScroll: true }), 0);
  }

  function openChat() {
    setChatToken((value) => value + 1);
  }

  function renderRoute() {
    if (currentPath === "/") return <HomePage onNavigate={navigate} onOpenChat={openChat} />;
    if (currentPath === "/gioi-thieu") return <AboutPage onNavigate={navigate} onOpenChat={openChat} />;
    if (currentPath === "/dich-vu") return <ServicesPage onNavigate={navigate} onOpenChat={openChat} />;
    if (currentPath.startsWith("/dich-vu/")) {
      const service = findService(currentPath.split("/").pop() || "");
      return service ? <ServiceDetailPage service={service} onNavigate={navigate} onOpenChat={openChat} /> : <NotFoundPage onNavigate={navigate} />;
    }
    if (currentPath === "/du-an") return <ProjectsPage onNavigate={navigate} onOpenChat={openChat} />;
    if (currentPath.startsWith("/du-an/")) {
      const project = findProject(currentPath.split("/").pop() || "");
      return project ? <ProjectDetailPage project={project} onNavigate={navigate} onOpenChat={openChat} /> : <NotFoundPage onNavigate={navigate} />;
    }
    if (currentPath === "/tin-tuc") return <NewsPage onNavigate={navigate} onOpenChat={openChat} />;
    if (currentPath.startsWith("/tin-tuc/")) {
      const article = findArticle(currentPath.split("/").pop() || "");
      return article ? <ArticlePage article={article} onNavigate={navigate} onOpenChat={openChat} /> : <NotFoundPage onNavigate={navigate} />;
    }
    if (currentPath === "/tuyen-dung") return <CareersPage onOpenChat={openChat} />;
    if (currentPath === "/lien-he") return <ContactPage onOpenChat={openChat} />;
    if (currentPath === "/chinh-sach-bao-mat") return <LegalPage type="privacy" />;
    if (currentPath === "/dieu-khoan-su-dung") return <LegalPage type="terms" />;
    return <NotFoundPage onNavigate={navigate} />;
  }

  // Hop thu la cong cu lam viec noi bo, khong phai trang marketing: khong dung
  // header/footer/nut lien he/khung chat cua website, va chiem tron man hinh.
  if (currentPath.startsWith("/quan-ly")) {
    return (
      <div className="admin-shell">
        <main id="main-content" ref={mainRef} tabIndex={-1}><InboxPage /></main>
      </div>
    );
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <Header currentPath={currentPath} onNavigate={navigate} />
      <main id="main-content" ref={mainRef} tabIndex={-1}>{renderRoute()}</main>
      <Footer onNavigate={navigate} />
      <FloatingContactButtons onOpenChat={openChat} />
      <AiConsultantChat currentPath={currentPath} openToken={chatToken} onNavigate={navigate} />
    </div>
  );
}
