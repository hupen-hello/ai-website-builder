import type { DashboardTab } from "./sidebar";

export const DASHBOARD_TAB_SLUGS: Record<DashboardTab, string | null> = {
  Dashboard: null,
  Profile: "profile",
  "My Websites": "my-websites",
  Plan: "plan",
  Billing: "billing",
};

const SLUG_TO_DASHBOARD_TAB = Object.fromEntries(
  Object.entries(DASHBOARD_TAB_SLUGS)
    .filter((entry): entry is [DashboardTab, string] => Boolean(entry[1]))
    .map(([tab, slug]) => [slug, tab]),
) as Record<string, DashboardTab>;

export function dashboardTabToPath(tab: DashboardTab): string {
  const slug = DASHBOARD_TAB_SLUGS[tab];
  return slug ? `/editor/dashboard/${slug}` : "/editor/dashboard";
}

export function dashboardTabFromSlug(slug?: string | null): DashboardTab | null {
  if (!slug) return "Dashboard";
  return SLUG_TO_DASHBOARD_TAB[slug] ?? null;
}

export function dashboardTabFromPathname(pathname: string): DashboardTab | null {
  const base = "/editor/dashboard";
  if (!pathname.startsWith(base)) return null;

  const remainder = pathname.slice(base.length).replace(/^\//, "");
  const slug = remainder.split("/")[0] || null;
  return dashboardTabFromSlug(slug);
}
