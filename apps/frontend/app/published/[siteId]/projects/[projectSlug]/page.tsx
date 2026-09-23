import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type ProjectRouteProps = {
  params: Promise<{ siteId: string; projectSlug: string }>;
};

const getPublishedParams = async (params: ProjectRouteProps["params"]) => {
  const { siteId, projectSlug } = await params;
  return {
    siteId,
    pageSlug: `projects/${projectSlug}`,
  };
};

export async function generateMetadata({ params }: ProjectRouteProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedProjectPage({
  params,
}: ProjectRouteProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}
