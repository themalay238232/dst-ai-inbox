"use client";

import { ArrowUp, Globe2, Mail, MapPin, Phone } from "lucide-react";
import { company, socialLinks } from "../../data/company";
import { hasConfiguredValue } from "../../data/companyConfig";
import { footerNavigation, navigation } from "../../data/navigation";
import { services } from "../../data/services";
import { AppLink } from "./AppLink";
import { BrandLogo } from "./BrandLogo";
import { trackEvent } from "../lib/tracking";

type FooterProps = { onNavigate: (path: string) => void };

export function Footer({ onNavigate }: FooterProps) {
  const hasContact = hasConfiguredValue(company.phone) || hasConfiguredValue(company.email) || hasConfiguredValue(company.address);

  return (
    <footer className="site-footer">
      <div className="footer-grid page-width">
        <section className="footer-brand">
          <BrandLogo variant="media" />
          <p>{company.description}</p>
        </section>
        <section>
          <h2>Khám phá</h2>
          <div className="footer-links">
            {navigation.slice(1).map((item) => <AppLink key={item.path} to={item.path} onNavigate={onNavigate}>{item.label}</AppLink>)}
          </div>
        </section>
        <section>
          <h2>Dịch vụ</h2>
          <div className="footer-links">
            {services.map((service) => <AppLink key={service.slug} to={`/dich-vu/${service.slug}`} onNavigate={onNavigate}>{service.navLabel}</AppLink>)}
          </div>
        </section>
        {hasContact ? <section>
          <h2>Liên hệ</h2>
          <div className="footer-contact">
            {hasConfiguredValue(company.phone) ? <a href={`tel:${company.phone}`} onClick={() => trackEvent("phone_click", { source: "footer" })}><Phone size={16} aria-hidden="true" />{company.phoneDisplay || company.phone}</a> : null}
            {hasConfiguredValue(company.email) ? <a href={`mailto:${company.email}`}><Mail size={16} aria-hidden="true" />{company.email}</a> : null}
            {hasConfiguredValue(company.address) ? <span><MapPin size={16} aria-hidden="true" />{company.address}</span> : null}
          </div>
        </section> : null}
        {socialLinks.length ? <section>
          <h2>Kết nối</h2>
          <div className="footer-contact">
            {socialLinks.map((item) => <a href={item.href} key={item.label} onClick={() => item.label.toLowerCase() === "zalo" ? trackEvent("zalo_click", { source: "footer" }) : undefined} target="_blank" rel="noopener noreferrer"><Globe2 size={16} aria-hidden="true" />{item.label}</a>)}
          </div>
        </section> : null}
      </div>
      <div className="footer-bottom page-width">
        <span>© {new Date().getFullYear()} {company.name}. {company.slogan}</span>
        <div className="footer-legal-links">{footerNavigation.map((item) => <AppLink key={item.path} to={item.path} onNavigate={onNavigate}>{item.label}</AppLink>)}</div>
        <button type="button" className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Trở về đầu trang">
          <ArrowUp size={17} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
