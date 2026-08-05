import type { CompanyConfig } from "./types";

// Leave fields blank until DST Group has approved a public value.
export const companyConfig: CompanyConfig = {
  name: "DST Group",
  legalName: "Công ty Cổ phần Tập Đoàn DST",
  slogan: "Dịch vụ tận tâm - Nâng tầm thương hiệu",
  description: "Đồng hành xây dựng thương hiệu rõ hướng đi và dễ triển khai.",
  phone: "0328247888",
  phoneDisplay: "0328 247 888",
  email: "info@dstgroup.vn",
  address: "Đường Cao Hà, phường Cao Xanh, Quảng Ninh",
  workingHours: "",
  website: "https://theluc205.github.io/websiteDST-ai-chat/",
  formEndpoint: "https://script.google.com/macros/s/AKfycbyns5EoE-vyiAr8MA1lH3H1wd3_HG0CfbArjTBPwfCFmJDt16KW7ej82g2fjBaBc18SVQ/exec",
  zaloUrl: "https://zalo.me/0328247888",
  mapEmbedUrl: "https://www.google.com/maps?q=Duong+Cao+Ha,+phuong+Cao+Xanh,+Quang+Ninh&output=embed",
  taxCode: "",
  legalInformation: "",
  socialLinks: [
    { label: "Zalo", href: "https://zalo.me/0328247888" },
  ],
};

export function hasConfiguredValue(value: string | undefined | null): value is string {
  return Boolean(value?.trim());
}
