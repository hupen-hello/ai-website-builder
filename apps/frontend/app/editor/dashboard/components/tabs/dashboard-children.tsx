import type { DashboardTab } from "../sidebar";
import DashboardTabContent from "./dashboard-tab";
import WebsitesTab from "./websites-tab";
import PlansTab from "./plans-tab";
import type { UserSite } from "../types";

type DashboardChildrenProps = {
  activeTab: DashboardTab;
  userName: string;
  sites: UserSite[];
  loadingSites: boolean;
  searchQuery: string;
  statusFilter: "all" | "published" | "draft";
  openingSiteId: string | null;
  deletingSiteId: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "published" | "draft") => void;
  onNavigate: (tab: DashboardTab) => void;
  onCreateWebsite: () => void;
  onEdit: (site: UserSite) => void;
  onDelete: (site: UserSite) => void;
};

function PlaceholderTab({ title }: { title: string }) {
  return (
    <section className="mx-auto w-full max-w-[1320px] px-6 py-8 lg:px-9">
      <div className="rounded-[26px] border border-zinc-200 bg-white p-8 text-center shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          {title}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          Reference dashboard UI is connected. Full {title.toLowerCase()}{" "}
          functionality will be wired in the next pass.
        </p>
      </div>
    </section>
  );
}

export default function DashboardChildren({
  activeTab,
  userName,
  sites,
  loadingSites,
  searchQuery,
  statusFilter,
  openingSiteId,
  deletingSiteId,
  onSearchChange,
  onStatusFilterChange,
  onNavigate,
  onCreateWebsite,
  onEdit,
  onDelete,
}: DashboardChildrenProps) {
  switch (activeTab) {
    case "My Websites":
      return (
        <WebsitesTab
          sites={sites}
          loading={loadingSites}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          openingSiteId={openingSiteId}
          deletingSiteId={deletingSiteId}
          onSearchChange={onSearchChange}
          onStatusFilterChange={onStatusFilterChange}
          onCreateWebsite={onCreateWebsite}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
    case "Plan":
      return <PlansTab />;
    case "Billing":
      return <PlaceholderTab title="Billing" />;
    case "Profile":
      return <PlaceholderTab title="Profile" />;
    default:
      return (
        <DashboardTabContent
          userName={userName}
          sites={sites}
          loading={loadingSites}
          openingSiteId={openingSiteId}
          onManageWebsites={() => onNavigate("My Websites")}
          onViewAll={() => onNavigate("My Websites")}
          onCreateWebsite={onCreateWebsite}
          onEdit={onEdit}
        />
      );
  }
}
