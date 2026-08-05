import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  children?: Array<{ label: string; path: string }>;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface ContactInformation {
  name: string;
  legalName: string;
  slogan: string;
  description: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  workingHours: string;
  website: string;
  zaloUrl: string;
  mapEmbedUrl: string;
  taxCode: string;
  legalInformation: string;
}

export interface CompanyConfig extends ContactInformation {
  formEndpoint?: string;
  socialLinks: SocialLink[];
}

export interface Stat {
  value: string;
  label: string;
  isVerified: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Service {
  slug: string;
  title: string;
  navLabel: string;
  eyebrow: string;
  summary: string;
  description: string;
  icon: LucideIcon;
  image?: string;
  imageAlt?: string;
  tags: string[];
  audience: string;
  problems: string[];
  solutions: string[];
  deliverables: string[];
  process: string[];
  benefits: string[];
  faqs: FAQ[];
  relatedProjectSlugs: string[];
}

export interface Project {
  slug: string;
  title: string;
  clientName?: string;
  client?: string;
  industry: string;
  industryLabel: string;
  thumbnail?: string;
  image?: string;
  imageAlt?: string;
  summary?: string;
  challenge?: string;
  solution?: string[];
  implementation?: string[];
  deliverables?: string[];
  services: string[];
  duration?: string;
  results?: string[];
  gallery?: Array<{ src: string; alt: string }>;
  testimonial?: Testimonial;
  relatedServiceSlugs: string[];
  isVisible: boolean;
  isVerified: boolean;
}

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readingTime: string;
  image?: string;
  imageAlt?: string;
  featured?: boolean;
  sections: ArticleSection[];
}

export interface TeamMember {
  name: string;
  position: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
  experience?: string;
  specialization?: string;
  linkedin?: string;
  isVisible: boolean;
}

export interface Testimonial {
  name: string;
  position: string;
  company: string;
  quote: string;
  image?: string;
  imageAlt?: string;
  isVerified: boolean;
}

export interface ClientPartner {
  name: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  isVerified: boolean;
}

export interface CareerPosition {
  slug: string;
  title: string;
  department: string;
  workMode: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  note: string;
  isVisible: boolean;
}
