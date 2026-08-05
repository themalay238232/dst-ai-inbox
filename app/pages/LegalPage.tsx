import { ShieldCheck } from "lucide-react";
import { company } from "../../data/company";
import { hasConfiguredValue } from "../../data/companyConfig";
import { PageHero } from "../components/PageHero";

type LegalPageProps = { type: "privacy" | "terms" };

const content = {
  privacy: {
    eyebrow: "Chính sách bảo mật",
    title: "Nguyên tắc xử lý thông tin liên hệ",
    description: "DST Group tôn trọng thông tin bạn chủ động gửi qua biểu mẫu, kênh liên hệ trực tiếp và AI Chat trên website.",
    sections: [
      ["Phạm vi thông tin", "Khi bạn chủ động liên hệ, thông tin có thể bao gồm họ tên, số điện thoại, email, doanh nghiệp và nội dung cần tư vấn. Website không yêu cầu mật khẩu, mã OTP hoặc dữ liệu thanh toán."],
      ["Mục đích sử dụng", "Thông tin được sử dụng để phản hồi yêu cầu, trao đổi về phạm vi dịch vụ và hỗ trợ quá trình phối hợp khi cần thiết."],
      ["AI Chat và lịch sử trò chuyện", "AI Chat chỉ hỗ trợ trao đổi ban đầu. Lịch sử trò chuyện được lưu cục bộ trên trình duyệt và có thể được xóa ngay trong cửa sổ chat."],
      ["Liên hệ về thông tin", "Bạn có thể liên hệ DST Group để trao đổi về thông tin đã gửi qua các kênh liên hệ được công bố trên website."],
    ],
  },
  terms: {
    eyebrow: "Điều khoản sử dụng",
    title: "Điều khoản sử dụng website",
    description: "Các nội dung trên website giúp bạn tham khảo dịch vụ và cách DST Group tổ chức quá trình phối hợp.",
    sections: [
      ["Nội dung và tài liệu", "Nội dung, hình ảnh và tài liệu trên website thuộc phạm vi sử dụng hợp pháp của DST Group hoặc các bên đã cho phép công bố. Vui lòng không sao chép hoặc sử dụng lại khi chưa có sự đồng ý phù hợp."],
      ["Thông tin tư vấn", "Thông tin trên website mang tính tham khảo. Phạm vi, chi phí, thời gian và đầu ra chỉ được xác định sau khi các bên cùng làm rõ nhu cầu và thống nhất phương án triển khai."],
      ["Sử dụng biểu mẫu và AI Chat", "Người dùng có trách nhiệm cung cấp thông tin chính xác, không gửi nội dung trái pháp luật hoặc dữ liệu nhạy cảm qua biểu mẫu và AI Chat."],
      ["Trao đổi thêm", "DST Group có thể cập nhật nội dung website để phù hợp với dịch vụ và quy trình vận hành. Khi cần làm rõ, hãy liên hệ trực tiếp với đội ngũ."],
    ],
  },
} as const;

export function LegalPage({ type }: LegalPageProps) {
  const page = content[type];
  const contactHint = hasConfiguredValue(company.email) || hasConfiguredValue(company.phone)
    ? `Bạn có thể liên hệ ${company.name} qua các kênh liên hệ được hiển thị trên website.`
    : "Bạn có thể liên hệ DST Group qua kênh liên hệ được hiển thị trên website.";

  return (
    <>
      <PageHero eyebrow={page.eyebrow} title={page.title} description={page.description} compact />
      <section className="section page-width legal-content">
        <ShieldCheck size={30} aria-hidden="true" />
        {page.sections.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}
        <p className="legal-contact-hint">{contactHint}</p>
      </section>
    </>
  );
}
