"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { articleCategories, articles } from "../../data/articles";
import { ArticleCard } from "../components/ArticleCard";
import { CTASection } from "../components/CTASection";
import { PageHero } from "../components/PageHero";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

type PageProps = { onNavigate: (path: string) => void; onOpenChat: () => void };

export function NewsPage({ onNavigate, onOpenChat }: PageProps) {
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(4);
  const filtered = useMemo(() => articles.filter((article) => {
    const byCategory = category === "Tất cả" || article.category === category;
    const haystack = `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase("vi");
    return byCategory && haystack.includes(query.trim().toLocaleLowerCase("vi"));
  }), [category, query]);
  return (
    <>
      <PageHero eyebrow="Tin tức & góc nhìn" title="Những ghi chú hữu ích cho hoạt động Marketing" description="Nội dung ban đầu được tổ chức trong TypeScript để dễ biên tập hoặc thay thế bằng CMS/API sau này." image="assets/03-studio-content-creator.jpg" imageAlt="Chuẩn bị nội dung tại studio" />
      <section className="section page-width"><Reveal><SectionHeading eyebrow="Bài viết" title="Tìm theo chủ đề bạn quan tâm" /></Reveal><div className="news-controls"><label className="search-field"><Search size={18} aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(4); }} placeholder="Tìm bài viết" aria-label="Tìm bài viết" /></label><div className="category-tabs" role="group" aria-label="Danh mục bài viết">{articleCategories.map((item) => <button type="button" key={item} className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => { setCategory(item); setVisibleCount(4); }}>{item}</button>)}</div></div><div className="article-grid">{filtered.slice(0, visibleCount).map((article) => <Reveal key={article.slug}><ArticleCard article={article} onNavigate={onNavigate} featured={article.featured} /></Reveal>)}</div>{!filtered.length ? <p className="empty-state">Không tìm thấy bài viết phù hợp.</p> : null}{visibleCount < filtered.length ? <div className="load-more"><button className="ghost-btn" type="button" onClick={() => setVisibleCount((count) => count + 4)}>Xem thêm bài viết</button></div> : null}</section>
      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} title="Cần trao đổi một tình huống cụ thể?" />
    </>
  );
}
