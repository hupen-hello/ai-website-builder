import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type PortfolioRouteProps = {
  params: Promise<{ siteId: string; portfolioSlug: string }>;
};

const getPublishedParams = async (params: PortfolioRouteProps["params"]) => {
  const { siteId, portfolioSlug } = await params;
  return {
    siteId,
    pageSlug: `portfolio/${portfolioSlug}`,
  };
};

export async function generateMetadata({ params }: PortfolioRouteProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedPortfolioPage({
  params,
}: PortfolioRouteProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}
