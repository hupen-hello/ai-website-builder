import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type PropertyRouteProps = {
  params: Promise<{ siteId: string; propertySlug: string }>;
};

const getPublishedParams = async (params: PropertyRouteProps["params"]) => {
  const { siteId, propertySlug } = await params;
  return {
    siteId,
    pageSlug: `property/${propertySlug}`,
  };
};

export async function generateMetadata({ params }: PropertyRouteProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedPropertyPage({
  params,
}: PropertyRouteProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}
