import type { CareerPosition } from "./types";

export const careerPositions: CareerPosition[] = [];
export const visibleCareerPositions = careerPositions.filter((position) => position.isVisible);
