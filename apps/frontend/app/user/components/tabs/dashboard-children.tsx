import type { DashboardTab } from "../sidebar";
import DashboardTabContent from "./dashboard-tab";
import WebsitesTab from "./websites-tab";
import DownloadsTab from "./downloads-tab";
import PlansTab from "./plans-tab";
import AddonsTab from "./addons-tab";
import ProfileTab from "./profile-tab";
import BillingTab from "./billing-tab";
import NotificationsTab from "./notifications-tab";
import WebsitesLeadsTab from "./websites-leads-tab";
import DomainsTab from "./domains-tab";
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
  renamingSiteId: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "all" | "published" | "draft") => void;
  onNavigate: (tab: DashboardTab) => void;
  onCreateWebsite: () => void;
  onEdit: (site: UserSite) => void;
  onDelete: (site: UserSite) => void;
  onRename: (site: UserSite, title: string) => Promise<void>;
};

export default function DashboardChildren({
  activeTab,
  userName,
  sites,
  loadingSites,
  searchQuery,
  statusFilter,
  openingSiteId,
  deletingSiteId,
  renamingSiteId,
  onSearchChange,
  onStatusFilterChange,
  onNavigate,
  onCreateWebsite,
  onEdit,
  onDelete,
  onRename,
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
          renamingSiteId={renamingSiteId}
          onSearchChange={onSearchChange}
          onStatusFilterChange={onStatusFilterChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onRename={onRename}
        />
      );
    case "Download Management":
      return <DownloadsTab sites={sites} onNavigate={onNavigate} />;
    case "Websites Lead":
      return <WebsitesLeadsTab />;
    case "Domains":
      return (
        <DomainsTab
          sites={sites}
          loadingSites={loadingSites}
          onNavigate={onNavigate}
        />
      );
    case "Plan":
      return <PlansTab sites={sites} loadingSites={loadingSites} onNavigate={onNavigate} />;
    case "Addons":
      return (
        <AddonsTab
          sites={sites}
          loadingSites={loadingSites}
          onNavigate={onNavigate}
        />
      );
    case "Billing":
      return <BillingTab onNavigate={onNavigate} sites={sites} />;
    case "Notifications":
      return <NotificationsTab onNavigate={onNavigate} />;
    case "Profile":
      return <ProfileTab />;
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
