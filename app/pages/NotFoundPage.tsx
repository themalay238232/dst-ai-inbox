import { ArrowLeft } from "lucide-react";
import { AppLink } from "../components/AppLink";

type NotFoundPageProps = { onNavigate: (path: string) => void };

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return <section className="not-found page-width"><p className="eyebrow">404</p><h1>Không tìm thấy trang bạn cần.</h1><p>Đường dẫn có thể đã thay đổi hoặc chưa được xuất bản.</p><AppLink className="primary-btn" to="/" onNavigate={onNavigate}><ArrowLeft size={17} aria-hidden="true" />Về trang chủ</AppLink></section>;
}
