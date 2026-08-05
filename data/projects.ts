import type { Project } from "./types";

// Projects are published only after DST Group confirms the client, scope, outcomes and asset permissions.
export const projects: Project[] = [];

export const projectFilters: Array<{ value: string; label: string }> = [];

export const visibleProjects = projects.filter((project) => project.isVisible && project.isVerified);

export function findProject(slug: string) {
  return visibleProjects.find((project) => project.slug === slug);
}
