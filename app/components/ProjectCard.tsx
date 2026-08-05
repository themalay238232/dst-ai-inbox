import { ArrowUpRight } from "lucide-react";
import type { Project } from "../../data/types";
import { assetPath } from "../lib/site";
import { AppLink } from "./AppLink";
import { trackEvent } from "../lib/tracking";

type ProjectCardProps = { project: Project; onNavigate: (path: string) => void };

export function ProjectCard({ project, onNavigate }: ProjectCardProps) {
  const image = project.thumbnail || project.image;
  const clientName = project.clientName || project.client;

  return (
    <article className="project-card">
      {image ? <img src={assetPath(image)} alt={project.imageAlt || project.title} loading="lazy" decoding="async" /> : null}
      <div className="project-card-body">
        <span>{project.industryLabel}</span>
        <h3>{project.title}</h3>
        {clientName ? <p className="project-client">{clientName}</p> : null}
        {project.summary ? <p>{project.summary}</p> : null}
        {project.services.length ? <ul>{project.services.slice(0, 2).map((service) => <li key={service}>{service}</li>)}</ul> : null}
        <AppLink className="card-link" to={`/du-an/${project.slug}`} onNavigate={onNavigate} onClick={() => trackEvent("project_view", { slug: project.slug })}>Xem chi tiết <ArrowUpRight size={16} aria-hidden="true" /></AppLink>
      </div>
    </article>
  );
}
