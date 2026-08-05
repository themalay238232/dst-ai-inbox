import { CheckCircle2, CircleHelp, ClipboardList, Compass, Lightbulb, Phone } from "lucide-react";
import type { Service } from "../../data/types";
import { findProject } from "../../data/projects";
import { company } from "../../data/company";
import { hasConfiguredValue } from "../../data/companyConfig";
import { Breadcrumb } from "../components/Breadcrumb";
import { ConsultationForm } from "../components/ConsultationForm";
import { PageHero } from "../components/PageHero";
import { ProjectCard } from "../components/ProjectCard";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { CTASection } from "../components/CTASection";
import { AppLink } from "../components/AppLink";

type ServiceDetailPageProps = { service: Service; onNavigate: (path: string) => void; onOpenChat: () => void };

export function ServiceDetailPage({ service, onNavigate, onOpenChat }: ServiceDetailPageProps) {
  const Icon = service.icon;
  const relatedProjects = service.relatedProjectSlugs.map(findProject).filter((project): project is NonNullable<typeof project> => Boolean(project));
  return (
    <>
      <Breadcrumb items={[{ label: "Trang chủ", path: "/" }, { label: "Dịch vụ", path: "/dich-vu" }, { label: service.title }]} onNavigate={onNavigate} />
      <PageHero eyebrow={service.eyebrow} title={service.title} description={service.description} image={service.image} imageAlt={service.imageAlt} actions={<><AppLink className="primary-btn" to="/lien-he" onNavigate={onNavigate}>Nhận tư vấn</AppLink>{hasConfiguredValue(company.phone) ? <a className="ghost-btn" href={`tel:${company.phone}`}><Phone size={17} aria-hidden="true" />Gọi {company.phoneDisplay || company.phone}</a> : null}</>}><span className="hero-service-icon"><Icon size={23} aria-hidden="true" /></span></PageHero>
      <section className="section page-width service-intro-grid">
        <Reveal><article className="content-panel"><Compass size={25} aria-hidden="true" /><h2>Phù hợp với</h2><p>{service.audience}</p></article></Reveal>
        <Reveal><article className="content-panel"><Lightbulb size={25} aria-hidden="true" /><h2>Vấn đề thường gặp</h2><ul className="check-list">{service.problems.map((item) => <li key={item}><CheckCircle2 size={17} aria-hidden="true" />{item}</li>)}</ul></article></Reveal>
      </section>
      <section className="section section-soft"><div className="page-width"><Reveal><SectionHeading eyebrow="Giải pháp DST" title="Cách tiếp cận theo từng bước" /></Reveal><div className="solution-grid">{service.solutions.map((item, index) => <Reveal key={item}><article><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></article></Reveal>)}</div></div></section>
      <section className="section page-width service-intro-grid">
        <Reveal><article className="content-panel"><ClipboardList size={25} aria-hidden="true" /><h2>Hạng mục bàn giao</h2><ul className="check-list">{service.deliverables.map((item) => <li key={item}><CheckCircle2 size={17} aria-hidden="true" />{item}</li>)}</ul></article></Reveal>
        <Reveal><article className="content-panel"><CircleHelp size={25} aria-hidden="true" /><h2>Quy trình thực hiện</h2><ol className="compact-process">{service.process.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol></article></Reveal>
      </section>
      <section className="section page-width"><Reveal><SectionHeading eyebrow="Giá trị nhận được" title="Lợi ích khi phạm vi được làm rõ" /></Reveal><div className="benefit-grid">{service.benefits.map((benefit) => <Reveal key={benefit}><article><CheckCircle2 size={21} aria-hidden="true" /><p>{benefit}</p></article></Reveal>)}</div></section>
      {relatedProjects.length ? <section className="section section-soft"><div className="page-width"><Reveal><SectionHeading eyebrow="Dự án liên quan" title="Ví dụ triển khai theo nhóm dịch vụ" /></Reveal><div className="project-grid">{relatedProjects.map((project) => <Reveal key={project.slug}><ProjectCard project={project} onNavigate={onNavigate} /></Reveal>)}</div></div></section> : null}
      <section className="section page-width faq-form-grid">
        <Reveal><div><SectionHeading eyebrow="Câu hỏi thường gặp" title="Một số điều doanh nghiệp thường muốn làm rõ" /><div className="faq-list">{service.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></div></Reveal>
        <Reveal><ConsultationForm service={service.slug} /></Reveal>
      </section>
      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} title={`Trao đổi về ${service.title}`} description="Hãy chia sẻ mục tiêu và bối cảnh. DST sẽ cùng bạn xác định phạm vi cần ưu tiên." />
    </>
  );
}
