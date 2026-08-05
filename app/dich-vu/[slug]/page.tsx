import { WebsiteApp } from "../../WebsiteApp";

export default async function ServiceRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WebsiteApp initialPath={`/dich-vu/${slug}`} />;
}
