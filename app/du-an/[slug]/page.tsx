import { WebsiteApp } from "../../WebsiteApp";

export default async function ProjectRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WebsiteApp initialPath={`/du-an/${slug}`} />;
}
