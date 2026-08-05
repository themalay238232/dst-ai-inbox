import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { assetPath } from "../lib/site";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  image?: string;
  imageAlt?: string;
  compact?: boolean;
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions, image, imageAlt, compact = false, children }: PageHeroProps) {
  return (
    <section className={`page-hero ${compact ? "is-compact" : ""}`}>
      <div className="page-hero-grid page-width">
        <div className="page-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
          {children}
        </div>
        {image ? (
          <figure className="page-hero-media">
            <img src={assetPath(image)} alt={imageAlt || ""} loading="eager" decoding="async" />
            <span className="hero-media-mark" aria-hidden="true"><ArrowUpRight size={20} /></span>
          </figure>
        ) : null}
      </div>
    </section>
  );
}
