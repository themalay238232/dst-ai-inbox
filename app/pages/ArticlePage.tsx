"use client";

import { Clipboard, Share2 } from "lucide-react";
import { useState } from "react";
import type { Article } from "../../data/types";
import { articles } from "../../data/articles";
import { Breadcrumb } from "../components/Breadcrumb";
import { ArticleCard } from "../components/ArticleCard";
import { CTASection } from "../components/CTASection";
import { PageHero } from "../components/PageHero";
import { Reveal } from "../components/Reveal";
import { formatDate } from "../lib/site";

type ArticlePageProps = { article: Article; onNavigate: (path: string) => void; onOpenChat: () => void };

export function ArticlePage({ article, onNavigate, onOpenChat }: ArticlePageProps) {
  const [copied, setCopied] = useState(false);
  const related = articles.filter((item) => item.slug !== article.slug && (item.category === article.category || item.featured)).slice(0, 3);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title, text: article.excerpt, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Trang chủ", path: "/" }, { label: "Tin tức", path: "/tin-tuc" }, { label: article.title }]} onNavigate={onNavigate} />
      <PageHero eyebrow={article.category} title={article.title} description={article.excerpt} image={article.image} imageAlt={article.imageAlt} compact><div className="article-hero-meta"><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time><span>{article.readingTime}</span></div></PageHero>
      <article className="article-layout page-width">
        <aside className="article-toc"><p>Mục lục</p><nav aria-label="Mục lục bài viết">{article.sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.heading}</a>)}</nav><div className="share-row"><button type="button" onClick={() => void share()} aria-label="Chia sẻ bài viết"><Share2 size={16} aria-hidden="true" />Chia sẻ</button><button type="button" onClick={() => void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true)).catch(() => undefined)} aria-label="Sao chép liên kết"><Clipboard size={16} aria-hidden="true" />{copied ? "Đã sao chép" : "Sao chép"}</button></div></aside>
        <div className="article-content"><p className="article-lead">{article.excerpt}</p>{article.sections.map((section) => <section id={section.id} key={section.id}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}</div>
      </article>
      {related.length ? <section className="section section-soft"><div className="page-width"><Reveal><h2 className="related-heading">Bài viết liên quan</h2></Reveal><div className="article-grid">{related.map((item) => <Reveal key={item.slug}><ArticleCard article={item} onNavigate={onNavigate} /></Reveal>)}</div></div></section> : null}
      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} title="Cần trao đổi về một nội dung cụ thể?" />
    </>
  );
}
