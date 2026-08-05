import { ContactForm } from "./ContactForm";

type ConsultationFormProps = { service?: string; title?: string };

export function ConsultationForm({ service, title = "Yêu cầu báo giá" }: ConsultationFormProps) {
  return <ContactForm kind="consultation" service={service} title={title} />;
}
