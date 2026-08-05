import type { NavigationItem } from "./types";
import { services } from "./services";

export const navigation: NavigationItem[] = [
  { label: "Trang chủ", path: "/" },
  { label: "Giới thiệu", path: "/gioi-thieu" },
  {
    label: "Dịch vụ",
    path: "/dich-vu",
    children: services.map((service) => ({ label: service.navLabel, path: `/dich-vu/${service.slug}` })),
  },
  { label: "Dự án", path: "/du-an" },
  { label: "Tin tức", path: "/tin-tuc" },
  { label: "Tuyển dụng", path: "/tuyen-dung" },
  { label: "Liên hệ", path: "/lien-he" },
];

export const footerNavigation = [
  { label: "Chính sách bảo mật", path: "/chinh-sach-bao-mat" },
  { label: "Điều khoản sử dụng", path: "/dieu-khoan-su-dung" },
];
