import { redirect } from "next/navigation";

type LegacyBlogPageProps = {
  params: Promise<{ siteId: string; blogSlug: string }>;
};

export default async function LegacyPublishedBlogPage({
  params,
}: LegacyBlogPageProps) {
  const { siteId, blogSlug } = await params;
  redirect(
    `/published/${encodeURIComponent(siteId)}/blog/${encodeURIComponent(blogSlug)}`,
  );
}
