"use client";

import { Filter, Layers3 } from "lucide-react";
import { useMemo, useState } from "react";
import { projectFilters, visibleProjects } from "../../data/projects";
import { AppLink } from "../components/AppLink";
import { CTASection } from "../components/CTASection";
import { PageHero } from "../components/PageHero";
import { ProjectCard } from "../components/ProjectCard";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";
import { assetPath } from "../lib/site";

type PageProps = { onNavigate: (path: string) => void; onOpenChat: () => void };

export function ProjectsPage({ onNavigate, onOpenChat }: PageProps) {
  const [filter, setFilter] = useState("all");
  const filters = useMemo(() => [{ value: "all", label: "Tất cả" }, ...projectFilters], []);
  const filtered = useMemo(() => filter === "all" ? visibleProjects : visibleProjects.filter((project) => project.industry === filter), [filter]);

  return (
    <>
      <PageHero eyebrow="Dự án DST Group" title="Tổ chức triển khai theo mục tiêu và phạm vi thực tế" description="DST chỉ công bố các dự án khi có quyền sử dụng thông tin và hình ảnh phù hợp. Mỗi hạng mục được xây dựng theo bối cảnh riêng của doanh nghiệp." image="assets/service-design-website.png" imageAlt="Mô phỏng giao diện website và hệ thống nhận diện" />
      {visibleProjects.length ? (
        <section className="section page-width">
          <Reveal><SectionHeading eyebrow="Danh mục dự án" title="Lọc theo lĩnh vực" description="Chọn một nhóm để xem các dự án đã được phép công bố." /></Reveal>
          <div className="filter-bar" role="group" aria-label="Lọc dự án"><Filter size={17} aria-hidden="true" />{filters.map((item) => <button type="button" key={item.value} className={filter === item.value ? "is-active" : ""} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
          <div className="project-grid filtered-projects">{filtered.map((project) => <Reveal key={project.slug}><ProjectCard project={project} onNavigate={onNavigate} /></Reveal>)}</div>
          {!filtered.length ? <p className="empty-state">Chưa có dự án phù hợp với lĩnh vực này.</p> : null}
        </section>
      ) : (
        <section className="section page-width project-intro-layout">
          <Reveal className="project-intro-media"><img src={assetPath("assets/04-studio-equipment.jpg")} alt="Không gian chuẩn bị sản xuất hình ảnh và video" loading="lazy" decoding="async" /></Reveal>
          <Reveal className="project-intro-copy"><p className="eyebrow">Cách DST triển khai</p><h2>Từ brief đến hạng mục có thể sử dụng</h2><p>Quy trình luôn bắt đầu bằng việc làm rõ mục tiêu, nhóm khách hàng ưu tiên và các điểm chạm cần tập trung. Sau đó, đội ngũ cùng thống nhất phạm vi, lịch phối hợp và đầu ra cần bàn giao.</p><ul className="check-list"><li><Layers3 size={17} aria-hidden="true" />Làm rõ bài toán và phạm vi</li><li><Layers3 size={17} aria-hidden="true" />Sắp xếp tiến độ và đầu mối phối hợp</li><li><Layers3 size={17} aria-hidden="true" />Bàn giao sản phẩm theo mục đích sử dụng</li></ul><AppLink className="primary-btn" to="/lien-he" onNavigate={onNavigate}>Trao đổi về dự án của bạn</AppLink></Reveal>
        </section>
      )}
      <CTASection onNavigate={onNavigate} onOpenChat={onOpenChat} title="Cần làm rõ phạm vi cho một dự án sắp triển khai?" />
    </>
  );
}
