import type { TeamMember } from "./types";

export const teamMembers: TeamMember[] = [
  {
    name: "Nguyễn Hữu Quân",
    position: "Chủ tịch Hội đồng quản trị",
    image: "assets/team/nguyen-huu-quan.jpg",
    imageAlt: "Ông Nguyễn Hữu Quân, Chủ tịch Hội đồng quản trị DST Group",
    imagePosition: "100% 50%",
    isVisible: true,
  },
  {
    name: "Vũ Văn Thương",
    position: "Tổng giám đốc",
    image: "assets/team/vu-van-thuong.jpg",
    imageAlt: "Ông Vũ Văn Thương, Tổng giám đốc DST Group",
    isVisible: true,
  },
  {
    name: "Nguyễn Quốc Kham",
    position: "Phó giám đốc",
    image: "assets/team/nguyen-quoc-kham.jpg",
    imageAlt: "Ông Nguyễn Quốc Kham, Phó giám đốc DST Group",
    imagePosition: "50% 42%",
    isVisible: true,
  },
];
export const visibleTeamMembers = teamMembers.filter((member) => member.isVisible && member.name.trim() && member.position.trim());
