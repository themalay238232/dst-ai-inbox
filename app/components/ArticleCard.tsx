import { ArrowUpRight, Clock3 } from "lucide-react";
import type { Article } from "../../data/types";
import { formatDate, assetPath } from "../lib/site";
import { AppLink } from "./AppLink";

type ArticleCardProps = { article: Article; onNavigate: (path: string) => void; featured?: boolean };

export function ArticleCard({ article, onNavigate, featured = false }: ArticleCardProps) {
  return (
    <article className={`article-card ${featured ? "is-featured" : ""}`}>
      {article.image ? <img src={assetPath(article.image)} alt={article.imageAlt || article.title} loading="lazy" decoding="async" /> : null}
      <div className="article-card-body">
        <div className="article-meta"><span>{article.category}</span><span><Clock3 size={14} aria-hidden="true" />{article.readingTime}</span></div>
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        <AppLink className="card-link" to={`/tin-tuc/${article.slug}`} onNavigate={onNavigate}>Đọc bài viết <ArrowUpRight size={16} aria-hidden="true" /></AppLink>
      </div>
    </article>
  );
}
