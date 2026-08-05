import { CheckCircle2, Layers3 } from "lucide-react";
import type { Project } from "../../data/types";
import { findService } from "../../data/services";
import { Breadcrumb } from "../components/Breadcrumb";
import { CTASection } from "../components/CTASection";
import { PageHero } from "../components/PageHero";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { ServiceCard } from "../components/ServiceCard";
import { assetPath } from "../lib/site";

type ProjectDetailPageProps = { project: Project; onNavigate: (path: string) => void; onOpenChat: () => void };

export function ProjectDetailPage({ project, onNavigate, onOpenChat }: ProjectDetailPageProps) {
  const relatedServices = project.relatedServiceSlugs.map(findService).filter((service): service is NonNullable<typeof service> => Boolean(service));
  const image = project.thumbnail || project.image;
  const clientName = project.clientName || project.client;

  return (
    <>
      <Breadcrumb items={[{ label: "Trang chủ", path: "/" }, { label: "Dự án", path: "/du-an" }, { label: project.title }]} onNavigate={onNavigate} />
      <PageHero eyebrow={[project.industryLabel, clientName].filter(Boolean).join(" · ")} title={project.title} description={project.summary || "Thông tin dự án được trình bày theo phạm vi đã được phép công bố."} image={image} imageAlt={project.imageAlt}><div className="hero-tag-list">{project.services.map((service) => <span key={service}>{service}</span>)}</div></PageHero>
      {(project.challenge || project.solution?.length) ? <section className="section page-width project-detail-grid">{project.challenge ? <Reveal><article className="content-panel"><p className="eyebrow">Bài toán khách hàng</p><h2>Điểm cần giải quyết</h2><p>{project.challenge}</p></article></Reveal> : null}{project.solution?.length ? <Reveal><article className="content-panel"><p className="eyebrow">Giải pháp</p><h2>Hướng triển khai</h2><ul className="check-list">{project.solution.map((item) => <li key={item}><CheckCircle2 size={17} aria-hidden="true" />{item}</li>)}</ul></article></Reveal> : null}</section> : null}
      {project.implementation?.length ? <section className="section section-soft"><div className="page-width"><Reveal><SectionHeading eyebrow="Quá trình triển khai" title="Các bước được tổ chức trong dự án" /></Reveal><ol className="process-grid">{project.implementation.map((item, index) => <Reveal key={item}><li><span>{String(index + 1).padStart(2, "0")}</span><h3>Bước {index + 1}</h3><p>{item}</p></li></Reveal>)}</ol></div></section> : null}
      {project.deliverables?.length ? <section className="section page-width"><Reveal><SectionHeading eyebrow="Sản phẩm bàn giao" title="Các hạng mục theo phạm vi dự án" /></Reveal><ul className="check-list">{project.deliverables.map((item) => <li key={item}><Layers3 size={17} aria-hidden="true" />{item}</li>)}</ul></section> : null}
      {project.results?.length ? <section className="section section-soft"><div className="page-width"><Reveal><SectionHeading eyebrow="Kết quả" title="Giá trị được ghi nhận" /></Reveal><div className="benefit-grid">{project.results.map((item) => <Reveal key={item}><article><Layers3 size={21} aria-hidden="true" /><p>{item}</p></article></Reveal>)}</div></div></section> : null}
      {project.gallery?.length ? <section className="section page-width"><Reveal><SectionHeading eyebrow="Hình ảnh dự án" title="Tư liệu dự án" /></Reveal><div className="gallery-grid">{project.gallery.map((item) => <Reveal key={item.src}><figure><img src={assetPath(item.src)} alt={item.alt} loading="lazy" decoding="async" /><figcaption>{item.alt}</figcaption></figure></Reveal>)}</div></section> : null}
      {relatedServices.length ? <section className="section section-soft"><div className="page-width"><Reveal><SectionHeading eyebrow="Dịch vụ liên quan" title="Nhóm năng lực phù hợp với dự án" /></Reveal><div className="service-grid">{relatedServices.map((service) => <Reveal key={service.slug}><ServiceCard service={service} onNavigate={onNavigate} /></Reveal>)}</div></div></section> : null}
      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} title="Có dự án cần tổ chức lại từ mục tiêu đến triển khai?" />
    </>
  );
}
