import { WebsiteApp } from "../../WebsiteApp";

export default async function ArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WebsiteApp initialPath={`/tin-tuc/${slug}`} />;
}
