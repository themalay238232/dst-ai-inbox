import { ArrowRight, MessageCircle } from "lucide-react";
import { AppLink } from "./AppLink";
import { BrandLogo } from "./BrandLogo";
import { trackEvent } from "../lib/tracking";

type CTASectionProps = {
  title?: string;
  description?: string;
  onNavigate: (path: string) => void;
  onOpenChat?: () => void;
};

export function CTASection({
  title = "Sẵn sàng trao đổi về mục tiêu của bạn?",
  description = "Chia sẻ bối cảnh, ưu tiên và thời gian dự kiến. DST Group sẽ cùng bạn xác định bước tiếp theo phù hợp.",
  onNavigate,
  onOpenChat,
}: CTASectionProps) {
  return (
    <section className="cta-section page-width">
      <div>
        <p className="eyebrow">DST Group Marketing & Media</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="hero-actions">
          <AppLink className="primary-btn" to="/lien-he" onNavigate={onNavigate} onClick={() => trackEvent("cta_consultation", { source: "cta_section" })}>Nhận tư vấn <ArrowRight size={17} aria-hidden="true" /></AppLink>
          {onOpenChat ? <button className="ghost-btn" type="button" onClick={onOpenChat}><MessageCircle size={17} aria-hidden="true" />Hỏi AI tư vấn</button> : null}
        </div>
      </div>
      <div className="cta-logo-panel" aria-hidden="true"><BrandLogo variant="media" /></div>
    </section>
  );
}
