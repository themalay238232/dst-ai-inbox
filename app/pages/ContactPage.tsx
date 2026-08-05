import { Clock3, Mail, MapPin, MessageCircle, Phone, ReceiptText } from "lucide-react";
import { company } from "../../data/company";
import { hasConfiguredValue } from "../../data/companyConfig";
import { ConsultationForm } from "../components/ConsultationForm";
import { PageHero } from "../components/PageHero";
import { Reveal } from "../components/Reveal";
import { trackEvent } from "../lib/tracking";

type PageProps = { onOpenChat: () => void };

export function ContactPage({ onOpenChat }: PageProps) {
  const displayName = hasConfiguredValue(company.legalName) ? company.legalName : company.name;

  return (
    <>
      <PageHero
        eyebrow="Liên hệ DST Group"
        title="Trao đổi nhu cầu theo cách thuận tiện cho bạn"
        description="Bạn có thể gửi yêu cầu, gọi điện, liên hệ Zalo hoặc mở AI Chat để trao đổi về mục tiêu và phạm vi cần triển khai."
        image="assets/01-team-event-launch.jpg"
        imageAlt="Đội ngũ phối hợp trong một hoạt động truyền thông"
      />
      <section className="section page-width contact-page-grid">
        <Reveal>
          <div className="contact-details">
            <p className="eyebrow">Thông tin liên hệ</p>
            <h2>{displayName}</h2>
            {hasConfiguredValue(company.phone) ? <a href={`tel:${company.phone}`} onClick={() => trackEvent("phone_click", { source: "contact_page" })}><Phone size={19} aria-hidden="true" /><span><small>Điện thoại</small>{company.phoneDisplay || company.phone}</span></a> : null}
            {hasConfiguredValue(company.email) ? <a href={`mailto:${company.email}`}><Mail size={19} aria-hidden="true" /><span><small>Email</small>{company.email}</span></a> : null}
            {hasConfiguredValue(company.address) ? <span><MapPin size={19} aria-hidden="true" /><span><small>Địa chỉ</small>{company.address}</span></span> : null}
            {hasConfiguredValue(company.workingHours) ? <span><Clock3 size={19} aria-hidden="true" /><span><small>Giờ làm việc</small>{company.workingHours}</span></span> : null}
            {hasConfiguredValue(company.taxCode) ? <span><ReceiptText size={19} aria-hidden="true" /><span><small>Mã số thuế</small>{company.taxCode}</span></span> : null}
            <div className="contact-action-row">
              {hasConfiguredValue(company.zaloUrl) ? <a className="primary-btn" href={company.zaloUrl} onClick={() => trackEvent("zalo_click", { source: "contact_page" })} target="_blank" rel="noopener noreferrer">Liên hệ Zalo</a> : null}
              <button className="ghost-btn" type="button" onClick={onOpenChat}><MessageCircle size={17} aria-hidden="true" />Mở AI Chat</button>
            </div>
          </div>
        </Reveal>
        <Reveal><ConsultationForm title="Gửi yêu cầu tư vấn" /></Reveal>
      </section>
      {hasConfiguredValue(company.mapEmbedUrl) ? <section className="section section-soft"><div className="page-width"><Reveal><div className="map-frame"><iframe title="Bản đồ vị trí DST Group" src={company.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></Reveal></div></section> : null}
    </>
  );
}
