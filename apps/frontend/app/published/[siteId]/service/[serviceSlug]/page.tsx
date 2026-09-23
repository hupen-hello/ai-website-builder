import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type ServicePageProps = {
  params: Promise<{ siteId: string; serviceSlug: string }>;
};

const getPublishedParams = async (params: ServicePageProps["params"]) => {
  const { siteId, serviceSlug } = await params;
  return {
    siteId,
    pageSlug: `service/${serviceSlug}`,
  };
};

export async function generateMetadata({ params }: ServicePageProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedServicePage({ params }: ServicePageProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}
