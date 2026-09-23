import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../../page";

type CategoryPageProps = {
  params: Promise<{ siteId: string; categorySlug: string }>;
};

const getPublishedParams = async (params: CategoryPageProps["params"]) => {
  const { siteId, categorySlug } = await params;
  return {
    siteId,
    pageSlug: `service/category/${categorySlug}`,
  };
};

export async function generateMetadata({ params }: CategoryPageProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedServiceCategoryPage({
  params,
}: CategoryPageProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}
