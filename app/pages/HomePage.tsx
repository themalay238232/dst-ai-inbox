import { ArrowRight, CheckCircle2, ClipboardCheck, Layers3, Lightbulb, Plus, ShieldCheck, Users } from "lucide-react";
import { verifiedCompanyStats, verifiedTestimonials } from "../../data/company";
import { processSteps } from "../../data/home";
import { visibleProjects } from "../../data/projects";
import { services } from "../../data/services";
import { AppLink } from "../components/AppLink";
import { CTASection } from "../components/CTASection";
import { ProjectCard } from "../components/ProjectCard";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { ServiceCard } from "../components/ServiceCard";
import { assetPath } from "../lib/site";
import { trackEvent } from "../lib/tracking";

type PageProps = { onNavigate: (path: string) => void; onOpenChat: () => void };

const reasons = [
  { icon: Lightbulb, title: "Ưu tiên đúng việc", text: "Làm rõ mục tiêu và bối cảnh trước khi chọn kênh hoặc định dạng triển khai." },
  { icon: ClipboardCheck, title: "Phạm vi minh bạch", text: "Đầu việc, mốc phối hợp và sản phẩm bàn giao được thống nhất theo từng giai đoạn." },
  { icon: Layers3, title: "Kết nối các điểm chạm", text: "Nội dung, quảng cáo, media và thương hiệu cùng bám một hướng triển khai." },
  { icon: ShieldCheck, title: "Dễ phối hợp", text: "Thông tin cần phản hồi được tổ chức rõ để đội ngũ hai bên chủ động làm việc." },
];

export function HomePage({ onNavigate, onOpenChat }: PageProps) {
  const featuredProjects = visibleProjects.slice(0, 3);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-grid page-width">
          <Reveal className="home-hero-copy">
            <p className="eyebrow">DST GROUP · MARKETING · MEDIA · BRANDING</p>
            <h1>Tăng trưởng thương hiệu <span>có hệ thống</span></h1>
            <p className="hero-description">DST Group đồng hành từ chiến lược, nội dung, quảng cáo đến sản xuất hình ảnh và xây dựng thương hiệu, với phạm vi rõ ràng, tiến độ minh bạch và kết quả có thể đo lường.</p>
            <div className="hero-actions">
              <AppLink className="primary-btn" to="/lien-he" onNavigate={onNavigate} onClick={() => trackEvent("cta_consultation", { source: "home_hero" })}>Nhận tư vấn chiến lược <ArrowRight size={17} aria-hidden="true" /></AppLink>
              <AppLink className="ghost-btn" to="/du-an" onNavigate={onNavigate} onClick={() => trackEvent("project_view", { source: "home_hero" })}>Xem dự án đã triển khai</AppLink>
            </div>
            <ul className="hero-proof-list" aria-label="Nguyên tắc phối hợp">
              <li><CheckCircle2 size={16} aria-hidden="true" />Phạm vi rõ ràng</li>
              <li><CheckCircle2 size={16} aria-hidden="true" />Tiến độ minh bạch</li>
              <li><CheckCircle2 size={16} aria-hidden="true" />Đầu ra dễ sử dụng</li>
            </ul>
          </Reveal>

          <Reveal className="hero-workstage">
            <figure className="hero-workstage-screen">
              <img src={assetPath("assets/service-design-website.png")} alt="Mô phỏng giao diện website và hệ thống nhận diện đa thiết bị" loading="eager" decoding="async" />
              <figcaption>Website, nội dung và nhận diện cùng một định hướng</figcaption>
            </figure>
            <div className="hero-workstage-card hero-workstage-card-top">
              <span>01</span>
              <strong>Chiến lược & thông điệp</strong>
            </div>
            <div className="hero-workstage-card hero-workstage-card-bottom">
              <Users size={18} aria-hidden="true" />
              <span>Một nhịp phối hợp rõ ràng</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="service-ticker" aria-label="Nhóm dịch vụ DST Group">
        <div className="service-ticker-viewport">
          <div className="service-ticker-track">
            {services.map((service) => (
              <span className="service-ticker-item" key={service.slug}>
                <Plus size={14} aria-hidden="true" />
                {service.navLabel}
              </span>
            ))}
            {services.map((service) => (
              <span className="service-ticker-item" key={`${service.slug}-repeat`} aria-hidden="true">
                <Plus size={14} aria-hidden="true" />
                {service.navLabel}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section page-width intro-split intro-business">
        <Reveal className="intro-media">
          <img src={assetPath("assets/01-team-event-launch.jpg")} alt="Đội ngũ phối hợp trong một hoạt động truyền thông" loading="lazy" decoding="async" />
          <span><Users size={18} aria-hidden="true" />Chiến lược rõ ràng · Triển khai có nhịp</span>
        </Reveal>
        <Reveal className="intro-copy">
          <p className="eyebrow">Về DST Group</p>
          <h2>Tổ chức công việc truyền thông theo mục tiêu kinh doanh</h2>
          <p>DST Group phối hợp cùng doanh nghiệp để làm rõ ưu tiên, chuẩn hóa thông điệp và xây dựng các hạng mục có thể dùng xuyên suốt hành trình tiếp cận khách hàng.</p>
          <AppLink className="text-link" to="/gioi-thieu" onNavigate={onNavigate}>Tìm hiểu cách DST phối hợp <ArrowRight size={16} aria-hidden="true" /></AppLink>
        </Reveal>
      </section>

      <section className="section service-overview">
        <div className="page-width">
          <Reveal><SectionHeading eyebrow="Dịch vụ" title="Các nhóm năng lực có thể kết nối theo một kế hoạch" description="Từ định hướng đến sản phẩm bàn giao, mỗi dịch vụ được xác định bằng đầu việc và lợi ích phù hợp với bối cảnh thực tế." action={<AppLink className="text-link" to="/dich-vu" onNavigate={onNavigate}>Xem toàn bộ dịch vụ <ArrowRight size={16} aria-hidden="true" /></AppLink>} /></Reveal>
          <div className="service-grid">{services.map((service) => <Reveal key={service.slug}><ServiceCard service={service} onNavigate={onNavigate} /></Reveal>)}</div>
        </div>
      </section>

      <section className="section section-deep approach-section">
        <div className="page-width approach-layout">
          <Reveal>
            <p className="eyebrow">Cách DST làm việc</p>
            <h2>Không bắt đầu bằng một gói dịch vụ cố định</h2>
            <p>DST ưu tiên xác định mục tiêu, nguồn lực và phạm vi cần tập trung trước khi đề xuất cách triển khai. Nhờ vậy, đội ngũ hai bên có thể theo dõi công việc dễ hơn trong suốt quá trình phối hợp.</p>
          </Reveal>
          <div className="approach-list">{reasons.map((reason, index) => { const Icon = reason.icon; return <Reveal key={reason.title}><article><span>{String(index + 1).padStart(2, "0")}</span><div><Icon size={20} aria-hidden="true" /><h3>{reason.title}</h3><p>{reason.text}</p></div></article></Reveal>; })}</div>
        </div>
      </section>

      <section className="section page-width workflow-section">
        <Reveal><SectionHeading eyebrow="Quy trình" title="Rõ ràng từ trao đổi đến bàn giao" description="Các bước được điều chỉnh theo phạm vi công việc, nhưng luôn giữ một nhịp phối hợp dễ theo dõi." /></Reveal>
        <ol className="process-grid">{processSteps.map((step, index) => <Reveal key={step.title}><li><span>{String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.text}</p></li></Reveal>)}</ol>
      </section>

      {featuredProjects.length ? (
        <section className="section section-soft">
          <div className="page-width">
            <Reveal><SectionHeading eyebrow="Dự án nổi bật" title="Một số dự án đã được phép công bố" action={<AppLink className="text-link" to="/du-an" onNavigate={onNavigate}>Xem dự án <ArrowRight size={16} aria-hidden="true" /></AppLink>} /></Reveal>
            <div className="project-grid">{featuredProjects.map((project) => <Reveal key={project.slug}><ProjectCard project={project} onNavigate={onNavigate} /></Reveal>)}</div>
          </div>
        </section>
      ) : (
        <section className="section section-soft">
          <div className="page-width work-preview">
            <Reveal className="work-preview-media"><img src={assetPath("assets/04-studio-equipment.jpg")} alt="Không gian sản xuất hình ảnh và video" loading="lazy" decoding="async" /></Reveal>
            <Reveal className="work-preview-copy">
              <p className="eyebrow">Dự án & triển khai</p>
              <h2>Mỗi dự án cần được xây dựng theo bối cảnh riêng</h2>
              <p>DST chỉ công bố thông tin dự án khi có sự đồng ý phù hợp. Bạn có thể trao đổi với đội ngũ để xác định phạm vi công việc tương tự cho ngành hàng và mục tiêu của mình.</p>
              <div className="work-preview-points"><span>Marketing & quảng cáo</span><span>Media & sản xuất</span><span>Website & thương hiệu</span></div>
              <AppLink className="text-link" to="/du-an" onNavigate={onNavigate}>Xem cách DST tổ chức dự án <ArrowRight size={16} aria-hidden="true" /></AppLink>
            </Reveal>
          </div>
        </section>
      )}

      {verifiedCompanyStats.length ? <section className="section impact-section"><div className="page-width"><div className="stats-grid">{verifiedCompanyStats.map((stat) => <Reveal key={stat.label}><article><strong>{stat.value}</strong><span>{stat.label}</span></article></Reveal>)}</div></div></section> : null}

      {verifiedTestimonials.length ? <section className="section page-width testimonial-section"><Reveal><SectionHeading eyebrow="Khách hàng chia sẻ" title="Góc nhìn từ quá trình hợp tác" /></Reveal><div className="testimonial-grid">{verifiedTestimonials.map((item) => <Reveal key={item.name}><article className="testimonial-card">{item.image ? <img src={assetPath(item.image)} alt={item.imageAlt || item.name} loading="lazy" decoding="async" /> : null}<div><blockquote>“{item.quote}”</blockquote><strong>{item.name}</strong><p>{[item.position, item.company].filter(Boolean).join(", ")}</p></div></article></Reveal>)}</div></section> : <section className="section collaboration-cta"><div className="page-width"><Reveal><div><p className="eyebrow">Bắt đầu từ một cuộc trao đổi</p><h2>Bạn đang cần một đội ngũ đồng hành từ chiến lược đến triển khai?</h2><p>Hãy chia sẻ mục tiêu, ngành hàng và mốc thời gian dự kiến. DST sẽ cùng bạn xác định bước tiếp theo phù hợp.</p><AppLink className="primary-btn" to="/lien-he" onNavigate={onNavigate} onClick={() => trackEvent("cta_consultation", { source: "collaboration_cta" })}>Trao đổi cùng DST Group <ArrowRight size={17} aria-hidden="true" /></AppLink></div></Reveal></div></section>}

      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} />
    </>
  );
}
