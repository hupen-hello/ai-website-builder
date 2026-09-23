"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { UserAuthProvider, useUserAuth } from "@/components/auth/UserAuthContext";
import {
  clearEditorDraft,
  moveEditorDraftToSite,
  readEditorDraft,
  saveEditorDraft,
} from "@/lib/editorDraft";
import {
  clearUserActiveSiteId,
  setLastEditorUrl,
  setPublishedSiteUrl,
  USER_ACTIVE_SITE_ID_KEY,
} from "@/lib/migrateGuestSite";
import {
  AUTH_RETURN_URL_KEY,
  redirectToAuth,
} from "@/lib/authReturn";
import { hydratePersistedUserState } from "@/lib/userStateSync";
import {
  dashboardTabFromPathname,
  dashboardTabToPath,
} from "../components/dashboard-routes";
import Sidebar, { type DashboardTab } from "../components/sidebar";
import Navbar from "../components/navbar";
import DashboardChildren from "../components/tabs/dashboard-children";
import type { UserSite } from "../components/types";

type SiteDetail = UserSite & {
  config?: {
    templateId?: string;
    category?: string;
    pageLinks?: unknown[];
    sections?: unknown[];
    templateVariables?: Record<string, string>;
    businessInfo?: unknown;
    seo?: import("@/lib/siteSeo").SiteSeoSettings;
  };
};

const PRIVATE_EDITOR_RETURN_URL_KEY = "css-ai-private-editor-return-url";

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useUserAuth();
  const [sites, setSites] = useState<UserSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [openingSiteId, setOpeningSiteId] = useState<string | null>(null);
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);
  const [renamingSiteId, setRenamingSiteId] = useState<string | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<UserSite | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const activeTab = useMemo(
    () => dashboardTabFromPathname(pathname) ?? "Dashboard",
    [pathname],
  );

  useEffect(() => {
    const mountTimeout = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(mountTimeout);
  }, []);

  useEffect(() => {
    const tabFromUrl = dashboardTabFromPathname(pathname);
    if (tabFromUrl) return;

    if (pathname.startsWith("/user/")) {
      router.replace("/user/dashboard");
    }
  }, [pathname, router]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const loadSites = async () => {
    setLoadingSites(true);
    setError("");
    try {
      const [sitesRes, aiRes] = await Promise.all([
        fetch("/api/user/sites/mine", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/user/create-ai-designs", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);
      if (sitesRes.status === 401) {
        setSites([]);
        redirectToAuth({ returnUrl: pathname || "/user/dashboard" });
        return;
      }
      const data = await sitesRes.json().catch(() => []);
      if (!sitesRes.ok) {
        setError(data.message || "Unable to load your websites");
        setSites([]);
        return;
      }
      const siteRows: UserSite[] = (Array.isArray(data) ? data : []).map(
        (site: UserSite) => ({
          ...site,
          kind: site.kind || "site",
        }),
      );

      // designIds / titles already migrated/published as real Site rows
      const linkedCreateAiIds = new Set(
        siteRows
          .map((site) => (site.designId || "").trim().toLowerCase())
          .filter((id) => /^ca_/i.test(id)),
      );
      const linkedCreateAiTitles = new Set(
        siteRows
          .filter(
            (site) =>
              site.createPath === "create-ai" ||
              site.flow === "create-ai" ||
              site.flowLabel === "Create with AI",
          )
          .map((site) => (site.title || "").trim().toLowerCase())
          .filter(Boolean),
      );

      let aiRows: UserSite[] = [];
      if (aiRes.ok) {
        const aiData = await aiRes.json().catch(() => []);
        if (Array.isArray(aiData)) {
          aiRows = aiData
            .filter((design: {
              designKey?: string;
              title?: string | null;
              brandName?: string | null;
            }) => {
              const key = String(design.designKey || "")
                .trim()
                .toLowerCase();
              const title = String(design.title || design.brandName || "")
                .trim()
                .toLowerCase();
              // Hide Create-AI draft card once a Site exists for this design
              if (key && linkedCreateAiIds.has(key)) return false;
              if (title && linkedCreateAiTitles.has(title)) return false;
              return Boolean(key);
            })
            .map(
            (design: {
              designKey: string;
              title?: string | null;
              brandName?: string | null;
              category?: string | null;
              pageCount?: number;
              status?: string;
              updatedAt: string;
              createdAt?: string;
            }) => {
              const isPublished =
                design.status === "published" || design.status === "exported";
              return {
              id: design.designKey,
              title:
                design.title ||
                design.brandName ||
                "Create with AI website",
              slug: design.designKey,
              status: isPublished ? "published" : design.status || "draft",
              templateId: null,
              category: design.category || "Create with AI",
              published: isPublished,
              publishedAt: null,
              createdAt: design.createdAt,
              updatedAt: design.updatedAt,
              pageCount: design.pageCount || 1,
              isMultiPage: (design.pageCount || 1) > 1,
              flow: "create-ai",
              flowLabel: "Create with AI",
              createPath: "create-ai",
              designId: design.designKey,
              kind: "create-ai" as const,
            };
            },
          );
        }
      }

      const merged = [...aiRows, ...siteRows].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
      setSites(merged);
    } catch {
      setError("Unable to load your websites");
      setSites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    const loadTimeout = window.setTimeout(() => {
      if (!user) {
        setLoadingSites(false);
        // Protected /user/* pages should go to /auth, not an in-page login popup.
        redirectToAuth({ returnUrl: pathname || "/user/dashboard" });
        return;
      }
      void loadSites();
    }, 0);

    return () => window.clearTimeout(loadTimeout);
  }, [authLoading, user, pathname]);

  useEffect(() => {
    if (authLoading || !user) return;
    void hydratePersistedUserState(user.id).catch(() => undefined);
  }, [authLoading, user]);

  const displayUser = {
    name: user?.name || user?.email || "User",
    email: user?.email || "",
    avatar: user?.avatarUrl || null,
  };

  if (authLoading || !user) {
    return (
      <div className="grid h-dvh place-items-center bg-[#fbfaf9] text-[#18181b]">
        <div className="flex flex-col items-center gap-3 text-sm text-zinc-500">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          {authLoading ? "Checking account…" : "Redirecting to login…"}
        </div>
      </div>
    );
  }

  const handleOpenEditor = async (site: UserSite) => {
    setOpeningSiteId(site.id);
    setError("");

    try {
      if (
        site.kind === "create-ai" ||
        site.flow === "create-ai" ||
        site.createPath === "create-ai" ||
        /^ca_/i.test(site.id) ||
        (site.designId && /^ca_/i.test(site.designId))
      ) {
        const aiId =
          site.designId && /^ca_/i.test(site.designId)
            ? site.designId
            : site.id;
        router.push(
          `/create-ai/${encodeURIComponent(aiId)}?resume=1`,
        );
        return;
      }

      const previousActiveSiteId =
        sessionStorage.getItem(USER_ACTIVE_SITE_ID_KEY) ||
        localStorage.getItem(USER_ACTIVE_SITE_ID_KEY);
      if (previousActiveSiteId) {
        moveEditorDraftToSite(previousActiveSiteId);
      }

      const res = await fetch(`/api/user/sites/${site.id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as SiteDetail & {
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message || "Unable to open this website");
      }

      const templateId =
        data.config?.templateId || data.templateId || site.templateId || "";
      const category =
        data.config?.category || data.category || site.category || "";
      const sections = Array.isArray(data.config?.sections)
        ? data.config.sections
        : [];

      if (!templateId || !category || !sections.length) {
        throw new Error("This website has no editable content yet");
      }

      const existingDraft = readEditorDraft(templateId, category, site.id);
      const serverUpdatedAt = Date.parse(data.updatedAt);
      const keepNewerLocalDraft = Boolean(
        existingDraft &&
          (!Number.isFinite(serverUpdatedAt) ||
            existingDraft.updatedAt > serverUpdatedAt),
      );

      if (!keepNewerLocalDraft) {
        saveEditorDraft({
          siteId: site.id,
          templateId,
          category,
          sections,
          pageLinks: Array.isArray(data.config?.pageLinks)
            ? (data.config.pageLinks as never[])
            : [],
          templateVariables:
            data.config?.templateVariables &&
            typeof data.config.templateVariables === "object"
              ? data.config.templateVariables
              : {},
          seo: data.config?.seo,
        });
      }

      sessionStorage.setItem(USER_ACTIVE_SITE_ID_KEY, site.id);
      localStorage.setItem(USER_ACTIVE_SITE_ID_KEY, site.id);

      if (site.published && site.slug) {
        setPublishedSiteUrl(
          `${window.location.origin}/published/${site.slug}`,
        );
      }

      const params = new URLSearchParams({
        templateId,
        category,
        siteId: site.id,
      });
      if (
        site.flow === "redesign" ||
        site.createPath === "redesign" ||
        (site.designId && /^rd_/i.test(site.designId))
      ) {
        params.set("designId", site.designId || site.id);
      }
      const editorUrl = `/editor?${params.toString()}`;
      setLastEditorUrl(editorUrl);
      router.push(editorUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to open this website",
      );
    } finally {
      setOpeningSiteId(null);
    }
  };

  const handleRenameSite = async (site: UserSite, title: string) => {
    setRenamingSiteId(site.id);
    setError("");

    const parseMessage = (data: unknown, fallback: string) => {
      if (!data || typeof data !== "object") return fallback;
      const message = (data as { message?: string | string[] }).message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string" && message.trim()) return message;
      return fallback;
    };

    if (site.kind === "create-ai" || site.flow === "create-ai" || /^ca_/i.test(site.id)) {
      try {
        const res = await fetch("/api/user/create-ai-designs", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            designKey: site.id,
            title,
            brandName: title,
            category: site.category || undefined,
            pageCount: site.pageCount || 1,
            status: "draft",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(parseMessage(data, "Unable to rename AI design"));
        }
        setSites((prev) =>
          prev.map((item) =>
            item.id === site.id ? { ...item, title } : item,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to rename AI design",
        );
        throw err;
      } finally {
        setRenamingSiteId(null);
      }
      return;
    }

    const renameViaMigrate = async () => {
      const detailRes = await fetch(`/api/user/sites/${site.id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const detail = (await detailRes.json().catch(() => ({}))) as SiteDetail & {
        message?: string;
      };
      if (!detailRes.ok) {
        throw new Error(parseMessage(detail, "Unable to load website details"));
      }

      const templateId =
        detail.config?.templateId || detail.templateId || site.templateId || "";
      const category =
        detail.config?.category || detail.category || site.category || "";
      const sections = Array.isArray(detail.config?.sections)
        ? detail.config.sections
        : [];

      if (!templateId || !category || !sections.length) {
        throw new Error(
          "Unable to rename this website right now. Restart the backend server and try again.",
        );
      }

      const migrateRes = await fetch("/api/user/sites/migrate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.id,
          title,
          templateId,
          category,
          config: {
            templateId,
            category,
            clientUpdatedAt: Date.now(),
            pageLinks: Array.isArray(detail.config?.pageLinks)
              ? detail.config.pageLinks
              : [],
            sections,
            templateVariables:
              detail.config?.templateVariables &&
              typeof detail.config.templateVariables === "object"
                ? detail.config.templateVariables
                : {},
            businessInfo: detail.config?.businessInfo ?? null,
            seo: detail.config?.seo ?? null,
          },
        }),
      });
      const migrateData = await migrateRes.json().catch(() => ({}));
      if (!migrateRes.ok) {
        throw new Error(parseMessage(migrateData, "Unable to rename website"));
      }
    };

    try {
      const res = await fetch(`/api/user/sites/${site.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        await renameViaMigrate();
      } else if (!res.ok) {
        throw new Error(parseMessage(data, "Unable to rename website"));
      }

      setSites((prev) =>
        prev.map((item) => (item.id === site.id ? { ...item, title } : item)),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to rename website";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setRenamingSiteId(null);
    }
  };

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    setDeletingSiteId(siteToDelete.id);
    setError("");

    try {
      const isCreateAi =
        siteToDelete.kind === "create-ai" ||
        siteToDelete.flow === "create-ai" ||
        /^ca_/i.test(siteToDelete.id);

      const res = await fetch(
        isCreateAi
          ? `/api/user/create-ai-designs?designKey=${encodeURIComponent(siteToDelete.id)}`
          : `/api/user/sites/${siteToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Unable to delete website");
      }

      if (!isCreateAi) {
        const activeId =
          sessionStorage.getItem(USER_ACTIVE_SITE_ID_KEY) ||
          localStorage.getItem(USER_ACTIVE_SITE_ID_KEY);
        clearEditorDraft(siteToDelete.id);
        if (activeId === siteToDelete.id) {
          clearUserActiveSiteId();
          clearEditorDraft();
        }
      }

      setSites((prev) => prev.filter((item) => item.id !== siteToDelete.id));
      setSiteToDelete(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete website",
      );
    } finally {
      setDeletingSiteId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    // Don't bounce back to the dashboard after logout.
    try {
      window.sessionStorage.removeItem(AUTH_RETURN_URL_KEY);
      window.sessionStorage.removeItem(PRIVATE_EDITOR_RETURN_URL_KEY);
    } catch {
      /* ignore */
    }
    window.location.assign("/auth");
  };

  const handleCreateNewWebsite = () => {
    clearUserActiveSiteId();
    clearEditorDraft();
    router.push("/");
  };

  const selectTab = (tab: DashboardTab) => {
    if (tab === "My Websites") {
      setStatusFilter("all");
    }
    router.push(dashboardTabToPath(tab));
    setMobileOpen(false);
    setProfileOpen(false);
  };

  return (
    <div
      className={`grid h-dvh grid-cols-1 overflow-hidden bg-[#fbfaf9] text-[#18181b] transition-[grid-template-columns] duration-300 ${
        collapsed
          ? "md:grid-cols-[76px_minmax(0,1fr)]"
          : "md:grid-cols-[260px_minmax(0,1fr)]"
      }`}
    >
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[9990] bg-zinc-950/45 backdrop-blur-[3px] md:hidden"
        />
      ) : null}

      <Sidebar
        activeTab={activeTab}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCollapse={() => setCollapsed((current) => !current)}
        onMobileClose={() => setMobileOpen(false)}
        onSelect={selectTab}
        onLogout={() => void handleLogout()}
      />

      <div className="grid h-dvh min-w-0 grid-rows-[72px_minmax(0,1fr)]">
        <Navbar
          activeTab={activeTab}
          user={displayUser}
          profileOpen={profileOpen}
          profileRef={profileRef}
          onMenuClick={() => setMobileOpen(true)}
          onNavigate={selectTab}
          onProfileToggle={() => setProfileOpen((current) => !current)}
          onCreateWebsite={handleCreateNewWebsite}
          onLogout={() => void handleLogout()}
        />

        <main className="min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {error ? (
            <div className="mx-auto max-w-[1320px] px-6 pt-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            </div>
          ) : null}

          <DashboardChildren
            activeTab={activeTab}
            userName={displayUser.name}
            sites={sites}
            loadingSites={authLoading || loadingSites}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            openingSiteId={openingSiteId}
            deletingSiteId={deletingSiteId}
            renamingSiteId={renamingSiteId}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onNavigate={selectTab}
            onCreateWebsite={handleCreateNewWebsite}
            onEdit={(site) => void handleOpenEditor(site)}
            onDelete={setSiteToDelete}
            onRename={handleRenameSite}
          />
        </main>
      </div>

      {mounted &&
        siteToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close delete dialog"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() =>
                deletingSiteId ? undefined : setSiteToDelete(null)
              }
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white px-6 py-7 text-center shadow-2xl">
              <button
                type="button"
                onClick={() => setSiteToDelete(null)}
                disabled={Boolean(deletingSiteId)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={24} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950">
                Delete website?
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                This will permanently delete{" "}
                <span className="font-semibold text-slate-900">
                  {siteToDelete.title || "this website"}
                </span>
                . This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={Boolean(deletingSiteId)}
                  onClick={() => setSiteToDelete(null)}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Boolean(deletingSiteId)}
                  onClick={() => void handleDeleteSite()}
                  className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {deletingSiteId ? "Deleting..." : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default function UserSectionPage() {
  return (
    <UserAuthProvider>
      <DashboardContent />
    </UserAuthProvider>
  );
}
