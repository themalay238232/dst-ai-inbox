import { ArrowRight, Building2 } from "lucide-react";
import { services } from "../../data/services";
import { AppLink } from "../components/AppLink";
import { CTASection } from "../components/CTASection";
import { PageHero } from "../components/PageHero";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { ServiceCard } from "../components/ServiceCard";

type PageProps = { onNavigate: (path: string) => void; onOpenChat: () => void };

export function ServicesPage({ onNavigate, onOpenChat }: PageProps) {
  return (
    <>
      <PageHero eyebrow="Dịch vụ DST Group" title="Các nhóm dịch vụ có thể kết nối thành một lộ trình" description="Chọn dịch vụ phù hợp với mục tiêu hiện tại. Mỗi trang chi tiết nêu rõ vấn đề, cách triển khai, hạng mục, quy trình và câu hỏi thường gặp." image="assets/service-marketing-team.png" imageAlt="Đội ngũ trao đổi kế hoạch marketing" actions={<AppLink className="primary-btn" to="/lien-he" onNavigate={onNavigate}>Nhận tư vấn <ArrowRight size={17} aria-hidden="true" /></AppLink>} />
      <section className="section page-width"><Reveal><SectionHeading eyebrow="Dịch vụ chính" title="Bắt đầu từ mục tiêu cần ưu tiên" description="Phạm vi, đầu ra và chi phí sẽ được làm rõ sau khi DST hiểu bối cảnh thực tế của doanh nghiệp." /></Reveal><div className="service-grid">{services.map((service) => <Reveal key={service.slug}><ServiceCard service={service} onNavigate={onNavigate} /></Reveal>)}</div></section>
      <section className="section section-soft"><div className="page-width service-guidance"><Reveal><Building2 size={30} aria-hidden="true" /><h2>Chưa chắc nên bắt đầu từ dịch vụ nào?</h2><p>Hãy cho DST biết ngành hàng, mục tiêu ưu tiên và nguồn lực hiện có. Từ đó, nhóm sẽ đề xuất thứ tự hạng mục phù hợp thay vì yêu cầu bạn chọn một gói có sẵn.</p><AppLink className="text-link" to="/lien-he" onNavigate={onNavigate}>Trao đổi nhu cầu <ArrowRight size={16} aria-hidden="true" /></AppLink></Reveal></div></section>
      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} title="Cần một phạm vi phù hợp với mục tiêu hiện tại?" />
    </>
  );
}
