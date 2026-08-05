import { ArrowUpRight, Check } from "lucide-react";
import type { Service } from "../../data/types";
import { AppLink } from "./AppLink";

type ServiceCardProps = { service: Service; onNavigate: (path: string) => void };

export function ServiceCard({ service, onNavigate }: ServiceCardProps) {
  const Icon = service.icon;
  return (
    <article className="service-card">
      <div className="service-card-icon"><Icon size={25} aria-hidden="true" /></div>
      <p className="card-kicker">{service.eyebrow}</p>
      <h3>{service.title}</h3>
      <p>{service.summary}</p>
      <ul className="service-work-list">
        {service.deliverables.slice(0, 3).map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}
      </ul>
      <AppLink className="card-link" to={`/dich-vu/${service.slug}`} onNavigate={onNavigate}>Xem chi tiết <ArrowUpRight size={16} aria-hidden="true" /></AppLink>
    </article>
  );
}
