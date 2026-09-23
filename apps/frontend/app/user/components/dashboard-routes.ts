import type { DashboardTab } from "./sidebar";

export const DASHBOARD_TAB_SLUGS: Record<DashboardTab, string> = {
  Dashboard: "dashboard",
  Profile: "profile",
  "My Websites": "my-websites",
  "Download Management": "download-management",
  "Websites Lead": "websites-lead",
  Domains: "domains",
  Plan: "plan",
  Addons: "addons",
  Billing: "billing",
  Notifications: "notifications",
};

const SLUG_TO_DASHBOARD_TAB = Object.fromEntries(
  Object.entries(DASHBOARD_TAB_SLUGS).map(([tab, slug]) => [slug, tab]),
) as Record<string, DashboardTab>;

export const USER_DASHBOARD_PATHS = Object.values(DASHBOARD_TAB_SLUGS).map(
  (slug) => `/user/${slug}`,
);

export function dashboardTabToPath(tab: DashboardTab): string {
  return `/user/${DASHBOARD_TAB_SLUGS[tab]}`;
}

export function dashboardTabFromSlug(slug?: string | null): DashboardTab | null {
  if (!slug) return null;
  return SLUG_TO_DASHBOARD_TAB[slug] ?? null;
}

export function dashboardTabFromPathname(pathname: string): DashboardTab | null {
  if (!pathname.startsWith("/user/")) return null;

  const section = pathname.slice("/user/".length).split("/")[0];
  if (!section) return null;

  return dashboardTabFromSlug(section);
}
