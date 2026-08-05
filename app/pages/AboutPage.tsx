import { Compass, Target } from "lucide-react";
import { companyTimeline, companyValues } from "../../data/company";
import { visibleTeamMembers } from "../../data/team";
import { AppLink } from "../components/AppLink";
import { CTASection } from "../components/CTASection";
import { PageHero } from "../components/PageHero";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { assetPath } from "../lib/site";

type PageProps = { onNavigate: (path: string) => void; onOpenChat: () => void };

export function AboutPage({ onNavigate, onOpenChat }: PageProps) {
  return (
    <>
      <PageHero eyebrow="Giới thiệu DST Group" title="Đồng hành cùng doanh nghiệp từ định hướng đến triển khai" description="DST Group phát triển các giải pháp Marketing, Media và Branding theo bối cảnh, mục tiêu và nguồn lực thực tế của từng doanh nghiệp." image="assets/01-team-event-launch.jpg" imageAlt="Đội ngũ phối hợp trong một hoạt động truyền thông" actions={<AppLink className="primary-btn" to="/lien-he" onNavigate={onNavigate}>Nhận tư vấn</AppLink>} />
      <section className="section page-width content-split">
        <Reveal><div className="content-panel"><p className="eyebrow">Tổng quan</p><h2>Vai trò của DST trong từng dự án</h2><p>DST Group phối hợp với doanh nghiệp để tổ chức lại thông điệp, nội dung, hình ảnh và các hoạt động tiếp cận khách hàng. Mỗi phạm vi được thống nhất theo mục tiêu cụ thể thay vì áp dụng một gói cố định.</p></div></Reveal>
        <Reveal><div className="vision-mission"><article><Compass size={24} aria-hidden="true" /><h2>Định hướng</h2><p>Xây dựng cách làm giúp doanh nghiệp chủ động hơn trong việc tổ chức các điểm chạm Marketing, Media và thương hiệu.</p></article><article><Target size={24} aria-hidden="true" /><h2>Cam kết phối hợp</h2><p>Làm rõ mục tiêu, phạm vi và nhịp triển khai để các bên có thể theo dõi công việc thuận tiện hơn.</p></article></div></Reveal>
      </section>
      <section className="section section-soft"><div className="page-width"><Reveal><SectionHeading eyebrow="Giá trị cốt lõi" title="Nguyên tắc được ưu tiên trong cách làm" /></Reveal><div className="value-grid">{companyValues.map((value, index) => <Reveal key={value.title}><article><span>{String(index + 1).padStart(2, "0")}</span><h3>{value.title}</h3><p>{value.text}</p></article></Reveal>)}</div></div></section>
      {companyTimeline.length ? <section className="section page-width"><Reveal><SectionHeading eyebrow="Hành trình" title="Các mốc phát triển" /></Reveal><div className="timeline-list">{companyTimeline.map((item) => <Reveal key={item.year}><article><span>{item.year}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article></Reveal>)}</div></section> : null}
      {visibleTeamMembers.length ? <section className="section page-width"><Reveal><SectionHeading eyebrow="Đội ngũ" title="Ban lãnh đạo DST Group" /></Reveal><div className="team-grid">{visibleTeamMembers.map((member) => <Reveal key={member.name}><article>{member.image ? <img src={assetPath(member.image)} alt={member.imageAlt || member.name} loading="lazy" decoding="async" style={member.imagePosition ? { objectPosition: member.imagePosition } : undefined} /> : null}<h3>{member.name}</h3><p className="team-position">{member.position}</p>{member.specialization ? <p>{member.specialization}</p> : null}</article></Reveal>)}</div></section> : null}
      <section className="section section-deep"><div className="page-width capability-summary"><Reveal><div><p className="eyebrow">Năng lực phối hợp</p><h2>Kết nối các hạng mục thành một lộ trình dễ theo dõi</h2><p>Chiến lược, nội dung, thiết kế, sản xuất media và hoạt động triển khai có thể được sắp xếp theo từng giai đoạn phù hợp với mục tiêu của doanh nghiệp.</p></div></Reveal><Reveal><ul className="capability-list"><li>Định hướng và kế hoạch triển khai</li><li>Sản xuất nội dung, hình ảnh và video</li><li>Website, nhận diện và truyền thông đa kênh</li></ul></Reveal></div></section>
      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} title="Cùng làm rõ bước tiếp theo cho thương hiệu" />
    </>
  );
}
