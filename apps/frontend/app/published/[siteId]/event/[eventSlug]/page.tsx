import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type EventRouteProps = {
  params: Promise<{ siteId: string; eventSlug: string }>;
};

const getPublishedParams = async (params: EventRouteProps["params"]) => {
  const { siteId, eventSlug } = await params;
  return {
    siteId,
    pageSlug: `event/${eventSlug}`,
  };
};

export async function generateMetadata({ params }: EventRouteProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedEventPage({ params }: EventRouteProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}
