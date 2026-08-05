import { companyConfig, hasConfiguredValue } from "./companyConfig";
import type { ClientPartner, SocialLink, Stat, Testimonial } from "./types";

export const company = companyConfig;

export const companyValues = [
  {
    title: "Bắt đầu từ mục tiêu",
    text: "Làm rõ bối cảnh kinh doanh và ưu tiên trước khi chọn hạng mục triển khai.",
  },
  {
    title: "Phạm vi dễ theo dõi",
    text: "Đầu việc, mốc phối hợp và sản phẩm bàn giao được trao đổi rõ ràng từ đầu.",
  },
  {
    title: "Sáng tạo có định hướng",
    text: "Ý tưởng được đặt trong ngữ cảnh thương hiệu, kênh truyền thông và mục tiêu cụ thể.",
  },
  {
    title: "Tối ưu theo giai đoạn",
    text: "Các bên cùng rà soát để điều chỉnh cách triển khai khi bối cảnh thay đổi.",
  },
];

export const companyTimeline: Array<{ year: string; title: string; text: string }> = [];
export const companyStats: Stat[] = [];
export const testimonials: Testimonial[] = [];
export const clientPartners: ClientPartner[] = [];

export const verifiedCompanyStats = companyStats.filter((stat) => stat.isVerified);
export const verifiedTestimonials = testimonials.filter((testimonial) => testimonial.isVerified);
export const verifiedClientPartners = clientPartners.filter((client) => client.isVerified);
export const clientNames = verifiedClientPartners.map((client) => client.name);
export const socialLinks: SocialLink[] = company.socialLinks.filter((link) => hasConfiguredValue(link.href));
