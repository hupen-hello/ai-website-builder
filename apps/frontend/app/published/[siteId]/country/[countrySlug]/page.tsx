import PublishedSitePage, {
  generateMetadata as generatePublishedMetadata,
} from "../../page";

type CountryListingPageProps = {
  params: Promise<{ siteId: string; countrySlug: string }>;
};

const getPublishedParams = async (
  params: CountryListingPageProps["params"],
) => {
  const { siteId, countrySlug } = await params;
  return {
    siteId,
    pageSlug: `country/${countrySlug}`,
  };
};

export async function generateMetadata({ params }: CountryListingPageProps) {
  return generatePublishedMetadata({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}

export default async function PublishedCountryListingPage({
  params,
}: CountryListingPageProps) {
  return PublishedSitePage({
    params: Promise.resolve(await getPublishedParams(params)),
  });
}
