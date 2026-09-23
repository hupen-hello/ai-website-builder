import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type TeamRouteProps = {
  params: Promise<{ siteId: string; teamSlug: string }>;
};

const getPublishedParams = async (params: TeamRouteProps["params"]) => {
  const { siteId, teamSlug } = await params;
  return {
    siteId,
    pageSlug: `team/${teamSlug}`,
  };
};

export async function generateMetadata({ params }: TeamRouteProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedTeamPage({
  params,
}: TeamRouteProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}