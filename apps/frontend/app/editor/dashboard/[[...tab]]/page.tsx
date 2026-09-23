import { redirect } from "next/navigation";

const LEGACY_TAB_REDIRECTS: Record<string, string> = {
  profile: "/user/profile",
  "my-websites": "/user/my-websites",
  plan: "/user/plan",
  billing: "/user/billing",
  dashboard: "/user/dashboard",
};

export default async function LegacyDashboardRedirect({
  params,
}: {
  params: Promise<{ tab?: string[] }>;
}) {
  const { tab } = await params;
  const slug = tab?.[0];

  if (slug && LEGACY_TAB_REDIRECTS[slug]) {
    redirect(LEGACY_TAB_REDIRECTS[slug]);
  }

  redirect("/user/dashboard");
}
