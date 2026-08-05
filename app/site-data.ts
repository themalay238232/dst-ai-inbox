/**
 * @deprecated The active website reads from the focused modules in `data/`.
 * This facade keeps historical imports from breaking while avoiding a second,
 * stale copy of DST content in the app directory.
 */
export { navigation as navItems } from "../data/navigation";
export { companyStats as stats, clientNames, companyValues, testimonials } from "../data/company";
export { services } from "../data/services";
export { projects } from "../data/projects";
export { processSteps as process } from "../data/home";
