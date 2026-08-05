"use client";

import { CheckCircle2, ExternalLink, LoaderCircle, Send, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { company } from "../../data/company";
import { hasConfiguredValue } from "../../data/companyConfig";
import { services } from "../../data/services";
import { routeHref } from "../lib/site";
import { trackEvent } from "../lib/tracking";

type FormKind = "contact" | "consultation" | "application";
type FormStatus = { type: "idle" | "loading" | "success" | "error" | "info"; message?: string };

type ContactFormProps = {
  kind?: FormKind;
  service?: string;
  position?: string;
  title?: string;
};

type FormValues = {
  name: string;
  phone: string;
  email: string;
  company: string;
  service: string;
  position: string;
  budget: string;
  message: string;
  consent: boolean;
  companySite: string;
};

type FieldName = Exclude<keyof FormValues, "companySite">;
type FieldErrors = Partial<Record<FieldName, string>>;

const phonePattern = /^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/;
const initialValues: FormValues = {
  name: "",
  phone: "",
  email: "",
  company: "",
  service: "",
  position: "",
  budget: "",
  message: "",
  consent: false,
  companySite: "",
};

function getFormEndpoint() {
  const buildEndpoint = import.meta.env.VITE_DST_FORM_ENDPOINT?.trim();
  if (buildEndpoint) return buildEndpoint;
  if (typeof window !== "undefined") {
    const config = (window as Window & { __DST_FORM_CONFIG__?: { endpoint?: string } }).__DST_FORM_CONFIG__;
    if (config?.endpoint?.trim()) return config.endpoint.trim();
  }
  return company.formEndpoint?.trim() || "";
}

function fieldError(field: FieldName, values: FormValues, kind: FormKind) {
  const name = values.name.trim();
  const phone = values.phone.replace(/[\s.-]/g, "");
  const email = values.email.trim();
  const message = values.message.trim();

  if (field === "name" && (name.length < 2 || name.length > 80)) return "Vui lòng nhập họ và tên từ 2 đến 80 ký tự.";
  if (field === "phone" && !phonePattern.test(phone)) return "Vui lòng nhập số điện thoại Việt Nam hợp lệ.";
  if (field === "email" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120)) return "Vui lòng nhập email hợp lệ.";
  if (field === "service" && kind === "consultation" && !values.service) return "Vui lòng chọn dịch vụ quan tâm.";
  if (field === "position" && kind === "application" && !values.position) return "Vui lòng chọn vị trí ứng tuyển.";
  if (field === "message" && (message.length < 15 || message.length > 1000)) return "Nội dung cần từ 15 đến 1000 ký tự.";
  if (field === "consent" && !values.consent) return "Bạn cần đồng ý để DST Group xử lý thông tin tư vấn.";
  return "";
}

function validate(values: FormValues, kind: FormKind) {
  const fields: FieldName[] = ["name", "phone", "email", "message", "consent"];
  if (kind === "consultation") fields.push("service");
  if (kind === "application") fields.push("position");
  return fields.reduce<FieldErrors>((errors, field) => {
    const error = fieldError(field, values, kind);
    if (error) errors[field] = error;
    return errors;
  }, {});
}

function directContactUrl() {
  if (hasConfiguredValue(company.zaloUrl)) return company.zaloUrl;
  if (hasConfiguredValue(company.phone)) return `tel:${company.phone}`;
  return "";
}

export function ContactForm({ kind = "contact", service = "", position = "", title }: ContactFormProps) {
  const [values, setValues] = useState<FormValues>({ ...initialValues, service, position });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [endpoint] = useState(getFormEndpoint);
  const isEndpointConfigured = Boolean(endpoint);
  const submitLabel = useMemo(() => {
    if (!isEndpointConfigured) return "Tiếp tục qua kênh liên hệ";
    return kind === "application" ? "Gửi thông tin ứng tuyển" : "Gửi yêu cầu tư vấn";
  }, [isEndpointConfigured, kind]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    const validationFields: FieldName[] = ["name", "phone", "email", "company", "service", "position", "budget", "message", "consent"];
    if (validationFields.includes(key as FieldName)) {
      const field = key as FieldName;
      setErrors((current) => current[field] ? { ...current, [field]: undefined } : current);
    }
  }

  function validateOnBlur(field: FieldName) {
    const error = fieldError(field, values, kind);
    setErrors((current) => ({ ...current, [field]: error || undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (values.companySite) return;

    const nextErrors = validate(values, kind);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus({ type: "error", message: "Vui lòng kiểm tra các trường được đánh dấu." });
      return;
    }

    const rateKey = `dst-form-last-submit-${kind}`;
    const lastSubmit = Number(window.localStorage.getItem(rateKey) || 0);
    if (Date.now() - lastSubmit < 30_000) {
      setStatus({ type: "error", message: "Bạn vừa gửi yêu cầu. Vui lòng chờ khoảng 30 giây trước khi gửi lại." });
      return;
    }

    if (!isEndpointConfigured) {
      const target = directContactUrl();
      if (!target) {
        setStatus({ type: "error", message: "Kênh liên hệ trực tiếp hiện chưa có sẵn. Vui lòng quay lại sau." });
        return;
      }
      trackEvent("form_direct_contact", { kind });
      window.localStorage.setItem(rateKey, String(Date.now()));
      const opened = window.open(target, "_blank", "noopener,noreferrer");
      if (!opened) window.location.assign(target);
      setStatus({ type: "info", message: "DST đã mở kênh liên hệ trực tiếp để bạn tiếp tục trao đổi với đội ngũ." });
      return;
    }

    setStatus({ type: "loading" });
    try {
      const payload = new URLSearchParams({
        type: kind,
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        company: values.company.trim(),
        service: values.service,
        position: values.position,
        budget: values.budget,
        message: values.message.trim(),
        consent: String(values.consent),
        source: window.location.href,
        website: values.companySite,
      });
      const response = await fetch(endpoint, {
        method: "POST",
        body: payload,
        redirect: "follow",
      });
      const result = await response.json().catch(() => null) as { ok?: boolean } | null;
      if (!response.ok || result?.ok === false) throw new Error("FORM_SUBMIT_FAILED");
      window.localStorage.setItem(rateKey, String(Date.now()));
      trackEvent("form_submit", { kind });
      setStatus({ type: "success", message: "Cảm ơn bạn. DST Group đã nhận được yêu cầu và sẽ phản hồi theo thông tin bạn cung cấp." });
      setValues({ ...initialValues, service, position });
    } catch {
      setStatus({ type: "error", message: "Chưa thể gửi yêu cầu lúc này. Bạn có thể tiếp tục trao đổi qua kênh liên hệ trực tiếp của DST." });
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      {title ? <h2>{title}</h2> : null}
      {!isEndpointConfigured ? <p className="form-route-note">DST đang tiếp nhận yêu cầu qua kênh liên hệ trực tiếp.</p> : null}
      <input className="honeypot" name="company_site" value={values.companySite} onChange={(event) => update("companySite", event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form-grid">
        <label>Họ và tên<input value={values.name} onChange={(event) => update("name", event.target.value)} onBlur={() => validateOnBlur("name")} name="name" autoComplete="name" maxLength={80} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name ? <small id="name-error" className="field-error">{errors.name}</small> : null}</label>
        <label>Số điện thoại<input value={values.phone} onChange={(event) => update("phone", event.target.value)} onBlur={() => validateOnBlur("phone")} name="phone" inputMode="tel" autoComplete="tel" maxLength={20} required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} />{errors.phone ? <small id="phone-error" className="field-error">{errors.phone}</small> : null}</label>
        <label>Email<input value={values.email} onChange={(event) => update("email", event.target.value)} onBlur={() => validateOnBlur("email")} name="email" type="email" autoComplete="email" maxLength={120} required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email ? <small id="email-error" className="field-error">{errors.email}</small> : null}</label>
        <label>Tên doanh nghiệp <span className="optional">(nếu có)</span><input value={values.company} onChange={(event) => update("company", event.target.value)} name="company" autoComplete="organization" maxLength={120} /></label>
        <label>Dịch vụ quan tâm<select value={values.service} onChange={(event) => update("service", event.target.value)} onBlur={() => validateOnBlur("service")} name="service" required={kind === "consultation"} aria-invalid={Boolean(errors.service)} aria-describedby={errors.service ? "service-error" : undefined}><option value="">Chọn dịch vụ</option>{services.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select>{errors.service ? <small id="service-error" className="field-error">{errors.service}</small> : null}</label>
        <label>Ngân sách dự kiến <span className="optional">(nếu có)</span><select value={values.budget} onChange={(event) => update("budget", event.target.value)} name="budget"><option value="">Chọn khoảng ngân sách</option><option value="under-20">Dưới 20 triệu</option><option value="20-50">20 - 50 triệu</option><option value="50-100">50 - 100 triệu</option><option value="over-100">Trên 100 triệu</option><option value="discuss">Cần trao đổi thêm</option></select></label>
        {kind === "application" ? <label>Vị trí ứng tuyển<input value={values.position} onChange={(event) => update("position", event.target.value)} onBlur={() => validateOnBlur("position")} name="position" maxLength={120} required aria-invalid={Boolean(errors.position)} aria-describedby={errors.position ? "position-error" : undefined} />{errors.position ? <small id="position-error" className="field-error">{errors.position}</small> : null}</label> : null}
      </div>
      <label>Nội dung cần tư vấn<textarea value={values.message} onChange={(event) => update("message", event.target.value)} onBlur={() => validateOnBlur("message")} name="message" rows={5} maxLength={1000} required placeholder={kind === "application" ? "Giới thiệu ngắn về kinh nghiệm hoặc đường dẫn portfolio..." : "Chia sẻ mục tiêu, ngành hàng và thời gian dự kiến..."} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined} />{errors.message ? <small id="message-error" className="field-error">{errors.message}</small> : null}</label>
      <label className="consent-row"><input checked={values.consent} onChange={(event) => update("consent", event.target.checked)} onBlur={() => validateOnBlur("consent")} name="consent" type="checkbox" required aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-error" : undefined} /><span><ShieldCheck size={17} aria-hidden="true" />Tôi đồng ý để DST Group liên hệ và xử lý thông tin theo <a href={routeHref("/chinh-sach-bao-mat")}>chính sách bảo mật</a>.</span></label>
      {errors.consent ? <small id="consent-error" className="field-error">{errors.consent}</small> : null}
      <button className="primary-btn" type="submit" disabled={status.type === "loading"}>{status.type === "loading" ? <><LoaderCircle className="spin" size={17} aria-hidden="true" />Đang gửi</> : isEndpointConfigured ? <><Send size={17} aria-hidden="true" />{submitLabel}</> : <><ExternalLink size={17} aria-hidden="true" />{submitLabel}</>}</button>
      {status.type !== "idle" ? <p className={`form-status ${status.type}`} role="status">{status.type === "success" ? <CheckCircle2 size={17} aria-hidden="true" /> : null}{status.message}</p> : null}
    </form>
  );
}
