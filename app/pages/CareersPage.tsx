"use client";

import { ArrowDown, BriefcaseBusiness, HeartHandshake, Lightbulb } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { visibleCareerPositions } from "../../data/careers";
import { ContactForm } from "../components/ContactForm";
import { PageHero } from "../components/PageHero";
import { Reveal } from "../components/Reveal";
import { SectionHeading } from "../components/SectionHeading";

type PageProps = { onOpenChat: () => void };

const culture = [
  { icon: HeartHandshake, title: "Tôn trọng sự phối hợp", text: "Các nhóm cùng trao đổi rõ ràng để xử lý công việc và hỗ trợ khách hàng tốt hơn." },
  { icon: Lightbulb, title: "Học từ công việc thực tế", text: "Phản hồi và quá trình hoàn thiện sản phẩm là một phần quan trọng của việc phát triển năng lực." },
  { icon: BriefcaseBusiness, title: "Ưu tiên trách nhiệm", text: "Mỗi người chủ động với phần việc của mình và tôn trọng cam kết chung của dự án." },
];

export function CareersPage({ onOpenChat }: PageProps) {
  const [selectedSlug, setSelectedSlug] = useState(visibleCareerPositions[0]?.slug || "");
  const formRef = useRef<HTMLElement>(null);
  const selected = useMemo(() => visibleCareerPositions.find((position) => position.slug === selectedSlug) || visibleCareerPositions[0], [selectedSlug]);

  function selectPosition(slug: string) {
    setSelectedSlug(slug);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <PageHero eyebrow="Tuyển dụng DST Group" title="Cùng tạo ra những hạng mục truyền thông có giá trị sử dụng" description="DST Group tìm kiếm những người trân trọng sự phối hợp, chủ động với phần việc của mình và muốn phát triển qua các dự án thực tế." image="assets/02-team-celebration.jpg" imageAlt="Không khí phối hợp của đội ngũ" />
      <section className="section page-width"><Reveal><SectionHeading eyebrow="Môi trường & văn hóa" title="Những điều được ưu tiên khi phối hợp" /></Reveal><div className="reason-grid">{culture.map((item) => { const Icon = item.icon; return <Reveal key={item.title}><article className="reason-card"><Icon size={24} aria-hidden="true" /><h3>{item.title}</h3><p>{item.text}</p></article></Reveal>; })}</div></section>
      {visibleCareerPositions.length ? <><section className="section section-soft"><div className="page-width"><Reveal><SectionHeading eyebrow="Vị trí tuyển dụng" title="Các vị trí đang được công bố" /></Reveal><div className="job-list">{visibleCareerPositions.map((position) => <Reveal key={position.slug}><article className="job-card"><div><span>{position.department}</span><h3>{position.title}</h3><p>{position.summary}</p>{position.workMode ? <small>{position.workMode}</small> : null}</div><button type="button" className="ghost-btn" onClick={() => selectPosition(position.slug)}>Xem chi tiết <ArrowDown size={16} aria-hidden="true" /></button></article></Reveal>)}</div></div></section>{selected ? <section className="section page-width career-form-section" ref={formRef}><Reveal><div><p className="eyebrow">Ứng tuyển</p><h2>{selected.title}</h2><p>{selected.note}</p><div className="job-detail-columns"><div><h3>Trách nhiệm</h3><ul>{selected.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>Yêu cầu</h3><ul>{selected.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div></div></div></Reveal><Reveal><ContactForm key={selected.slug} kind="application" position={selected.title} title="Gửi thông tin ứng tuyển" /></Reveal></section> : null}</> : <section className="section section-soft"><div className="page-width"><Reveal><div className="career-empty-state"><p className="eyebrow">Kết nối cùng DST</p><h2>Thông tin tuyển dụng được công bố theo từng đợt phù hợp</h2><p>Khi có vị trí được DST Group xác nhận, mô tả công việc và cách ứng tuyển sẽ xuất hiện tại đây.</p><button className="text-link" type="button" onClick={onOpenChat}>Trao đổi với AI tư vấn</button></div></Reveal></div></section>}
    </>
  );
}
