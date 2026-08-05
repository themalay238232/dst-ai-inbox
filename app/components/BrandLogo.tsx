import { assetPath } from "../lib/site";

type BrandLogoProps = {
  variant?: "group" | "media";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ variant = "group", className = "", priority = false }: BrandLogoProps) {
  const src = variant === "media" ? "assets/logo-dst-marketing-media.png" : "assets/logo-dst-group.png";
  const alt = variant === "media" ? "DST Marketing - Media" : "DST Group - Dịch vụ tận tâm - Nâng tầm thương hiệu";
  return <img className={`brand-logo ${className}`} src={assetPath(src)} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />;
}
