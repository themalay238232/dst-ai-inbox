"use client";

import { MessageCircle, Phone } from "lucide-react";
import { company } from "../../data/company";
import { hasConfiguredValue } from "../../data/companyConfig";
import { trackEvent } from "../lib/tracking";

type FloatingContactButtonsProps = { onOpenChat: () => void };

export function FloatingContactButtons({ onOpenChat }: FloatingContactButtonsProps) {
  return (
    <aside className="floating-actions" aria-label="Liên hệ nhanh">
      {hasConfiguredValue(company.phone) ? <a href={`tel:${company.phone}`} onClick={() => trackEvent("phone_click", { source: "floating_actions" })} aria-label={`Gọi DST Group ${company.phoneDisplay || company.phone}`} title={`Gọi ${company.phoneDisplay || company.phone}`}><Phone size={19} aria-hidden="true" /></a> : null}
      {hasConfiguredValue(company.zaloUrl) ? <a href={company.zaloUrl} onClick={() => trackEvent("zalo_click", { source: "floating_actions" })} target="_blank" rel="noopener noreferrer" aria-label="Liên hệ DST Group qua Zalo" title="Liên hệ qua Zalo">Zalo</a> : null}
      <button type="button" onClick={onOpenChat} aria-label="Mở AI Chat" title="Mở AI Chat"><MessageCircle size={19} aria-hidden="true" /></button>
    </aside>
  );
}
