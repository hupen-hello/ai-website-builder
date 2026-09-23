import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type BlogPageProps = {
  params: Promise<{ siteId: string; blogSlug: string }>;
};

const getPublishedParams = async (params: BlogPageProps["params"]) => {
  const { siteId, blogSlug } = await params;
  return {
    siteId,
    pageSlug: `blog/${blogSlug}`,
  };
};

export async function generateMetadata({ params }: BlogPageProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedBlogPage({ params }: BlogPageProps) {
  const resolved = await getPublishedParams(params);
  // Render as JSX (do not invoke the page module as a plain function) so
  // Turbopack/React performance tracking does not abort mid-measure.
  return <PublishedSitePage params={Promise.resolve(resolved)} />;
}
