'use client';

import { useEffect, useRef, useState } from 'react';
import CardBox from '@/app/components/shared/CardBox';
import { Icon } from '@iconify/react';

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
  websiteCount: number;
  publishedWebsiteCount: number;
  draftWebsiteCount: number;
  createAiDesignCount?: number;
  flows?: {
    redesign?: boolean;
    createAi?: boolean;
    createCustom?: boolean;
  };
};

type AdminUserSite = {
  id: string;
  title: string;
  slug: string;
  status: string;
  templateId: string;
  category: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  flow?: string;
  flowLabel?: string;
};

type AdminCreateAiDesign = {
  id: string;
  designKey: string;
  title: string | null;
  brandName: string | null;
  category: string | null;
  pageType: string | null;
  pageCount: number;
  pageLabels: unknown;
  status: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
};

type UserPlanRecord = {
  siteId: string;
  siteTitle: string | null;
  siteSlug: string | null;
  planId: string;
  cycle: string | null;
  paymentId: string | null;
  orderId: string | null;
  upgradedAt: string | null;
  expiresAt: string | null;
  status: string;
};

type UserAddonRecord = {
  siteId: string;
  siteTitle: string | null;
  siteSlug: string | null;
  addonId: string;
  label: string;
  cycle: string | null;
  paymentId: string | null;
  orderId: string | null;
  purchasedAt: string | null;
  expiresAt: string | null;
  cancelledAt: string | null;
  status: string;
};

type UserExportRecord = {
  siteId: string;
  siteTitle: string | null;
  siteSlug: string | null;
  format: string;
  downloadsRemaining: number;
  downloadsMax: number;
  paymentId: string | null;
  orderId: string | null;
  purchasedAt: string | null;
  amountInr: number | null;
  status: string;
};

type UserDomainRecord = {
  id: string | null;
  domain: string;
  status: string;
  purchasedAt: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
  price: string | null;
  siteId: string;
  siteTitle: string | null;
  siteSlug: string | null;
  connectionStatus: string | null;
};

type UserDomainConnectionRecord = {
  id: string | null;
  domain: string;
  method: string | null;
  status: string | null;
  siteId: string;
  siteTitle: string | null;
  siteSlug: string | null;
  createdAt: string | null;
  verifiedAt: string | null;
};

type AdminUserDetails = AdminUser & {
  phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  sites: AdminUserSite[];
  createAiDesigns?: AdminCreateAiDesign[];
  createAiDesignCount?: number;
  plans?: UserPlanRecord[];
  addons?: UserAddonRecord[];
  exports?: UserExportRecord[];
  domains?: UserDomainRecord[];
  domainConnections?: UserDomainConnectionRecord[];
  billingSummary?: {
    activePlans: number;
    activeAddons: number;
    exportPurchases: number;
    domains: number;
    domainConnections: number;
    createAiDesigns?: number;
  };
};

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalSites: number;
  publishedSites: number;
  draftSites: number;
};

type UsersResponse = {
  users: AdminUser[];
  stats: UserStats;
  message?: string;
};

const emptyStats: UserStats = {
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  totalSites: 0,
  publishedSites: 0,
  draftSites: 0,
};

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
    timeZoneName: 'short',
  }).format(new Date(value));

const formatOptionalDate = (value?: string | null) =>
  value ? formatDateTime(value) : '—';

const statusBadgeClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'available' || normalized === 'verified') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
  }
  if (normalized === 'expiring' || normalized === 'pending' || normalized === 'starter') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
  }
  if (normalized === 'expired' || normalized === 'cancelled' || normalized === 'exhausted') {
    return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
  }
  return 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300';
};

const getInitials = (user: AdminUser) => {
  const source = user.name?.trim() || user.email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const getAvatarSource = (avatarUrl: string) => {
  if (/^(https?:|data:|blob:)/i.test(avatarUrl)) return avatarUrl;
  return `${FRONTEND_URL}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
};

function UserAvatar({
  user,
  size = 'small',
}: {
  user: AdminUser;
  size?: 'small' | 'large';
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [user.avatarUrl]);

  const isLarge = size === 'large';
  const avatarSource = user.avatarUrl ? getAvatarSource(user.avatarUrl) : null;
  const showImage = Boolean(avatarSource && !imageFailed);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden border font-bold text-white shadow-xl ${
        isLarge
          ? 'h-16 w-16 rounded-2xl border-white/20 bg-white/15 text-lg'
          : showImage
            ? 'h-10 w-10 rounded-full border-gray-200 bg-white text-xs shadow-[0_8px_20px_rgba(15,23,42,0.12)]'
            : 'h-10 w-10 rounded-xl border-red-400/20 bg-gradient-to-br from-[#e53935] to-[#a81420] text-xs shadow-[0_8px_20px_rgba(229,57,53,0.2)]'
      }`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSource ?? undefined}
          alt={`${user.name || 'User'} profile`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(user) || 'U'
      )}
    </span>
  );
}

const statCards = [
  {
    key: 'totalUsers' as const,
    label: 'Registered users',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'text-blue-600 dark:text-blue-400',
    background: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    key: 'activeUsers' as const,
    label: 'Active users',
    icon: 'solar:user-check-rounded-bold-duotone',
    color: 'text-emerald-600 dark:text-emerald-400',
    background: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    key: 'inactiveUsers' as const,
    label: 'Inactive users',
    icon: 'solar:user-block-rounded-bold-duotone',
    color: 'text-red-600 dark:text-red-400',
    background: 'bg-red-50 dark:bg-red-500/10',
  },
  {
    key: 'totalSites' as const,
    label: 'Total websites',
    icon: 'solar:global-bold-duotone',
    color: 'text-violet-600 dark:text-violet-400',
    background: 'bg-violet-50 dark:bg-violet-500/10',
  },
];

type PendingAction = {
  type: 'status' | 'delete';
  user: AdminUser;
};

type DetailsTab =
  | 'overview'
  | 'plans'
  | 'addons'
  | 'downloads'
  | 'domains'
  | 'websites'
  | 'create-ai';

type FlowFilter = 'all' | 'redesign' | 'create-ai' | 'create-custom';

const DELETE_CONFIRMATION_TEXT = 'yes-we-want-delete';

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats>(emptyStats);
  const [search, setSearch] = useState('');
  const [flowFilter, setFlowFilter] = useState<FlowFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [detailsTab, setDetailsTab] = useState<DetailsTab>('overview');
  const detailsRequestId = useRef(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [planBusyKey, setPlanBusyKey] = useState('');
  const [planError, setPlanError] = useState('');
  const [assignSiteId, setAssignSiteId] = useState('');
  const [assignCycle, setAssignCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [pendingPlanCancel, setPendingPlanCancel] = useState<{
    siteId: string;
    siteTitle: string;
  } | null>(null);

  const flowBadgeClass = (flow?: string) => {
    if (flow === 'redesign') {
      return 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300';
    }
    if (flow === 'create-ai') {
      return 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300';
    }
    if (flow === 'create-custom') {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
    }
    return 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400';
  };

  const runPlanAction = async (input: {
    action: 'assign' | 'extend' | 'cancel';
    siteId: string;
    cycle?: 'monthly' | 'yearly';
    days?: number;
  }) => {
    if (!selectedUser || planBusyKey) return false;
    const key = `${input.action}:${input.siteId}`;
    setPlanBusyKey(key);
    setPlanError('');
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          action: input.action,
          siteId: input.siteId,
          cycle: input.cycle,
          days: input.days,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as
        | AdminUserDetails
        | { message?: string };
      if (!response.ok || !('sites' in data)) {
        throw new Error(
          ('message' in data && data.message) || 'Unable to update plan',
        );
      }
      setSelectedUser(data);
      setRefreshKey((value) => value + 1);
      return true;
    } catch (requestError) {
      setPlanError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to update plan',
      );
      return false;
    } finally {
      setPlanBusyKey('');
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const query = search.trim()
          ? `?search=${encodeURIComponent(search.trim())}`
          : '';
        const response = await fetch(`/api/users${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => ({}))) as Partial<UsersResponse>;

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load registered users');
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
        setStats(data.stats || emptyStats);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setUsers([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load registered users',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search ? 300 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [refreshKey, search]);

  const openAction = (type: PendingAction['type'], user: AdminUser) => {
    setActionError('');
    setDeleteConfirmation('');
    setPendingAction({ type, user });
  };

  const closePendingAction = () => {
    if (actionLoading) return;
    setPendingAction(null);
    setDeleteConfirmation('');
    setActionError('');
  };

  const closeUserDetails = () => {
    detailsRequestId.current += 1;
    setSelectedUser(null);
    setDetailsLoading(false);
    setDetailsError('');
    setDetailsTab('overview');
  };

  const openUserDetails = async (user: AdminUser) => {
    const requestId = detailsRequestId.current + 1;
    detailsRequestId.current = requestId;
    setDetailsTab('overview');
    setSelectedUser({
      ...user,
      sites: [],
      createAiDesigns: [],
      plans: [],
      addons: [],
      exports: [],
      domains: [],
      domainConnections: [],
    });
    setDetailsLoading(true);
    setDetailsError('');

    try {
      const response = await fetch(
        `/api/users?id=${encodeURIComponent(user.id)}`,
        { cache: 'no-store' },
      );
      const data = (await response.json().catch(() => ({}))) as
        | AdminUserDetails
        | { message?: string };
      if (!response.ok || !('sites' in data)) {
        throw new Error(
          ('message' in data && data.message) || 'Unable to load user details',
        );
      }
      if (detailsRequestId.current === requestId) {
        setSelectedUser(data);
        setAssignSiteId(data.sites[0]?.id || '');
        setPlanError('');
      }
    } catch (requestError) {
      if (detailsRequestId.current !== requestId) return;
      setDetailsError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load user details',
      );
    } finally {
      if (detailsRequestId.current === requestId) setDetailsLoading(false);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction || actionLoading) return;
    if (
      pendingAction.type === 'delete' &&
      deleteConfirmation !== DELETE_CONFIRMATION_TEXT
    ) {
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const isDelete = pendingAction.type === 'delete';
      const nextStatus =
        pendingAction.user.status === 'Active' ? 'Inactive' : 'Active';
      const response = await fetch(
        isDelete
          ? `/api/users?id=${encodeURIComponent(pendingAction.user.id)}`
          : '/api/users',
        {
          method: isDelete ? 'DELETE' : 'PATCH',
          headers: isDelete ? undefined : { 'Content-Type': 'application/json' },
          body: isDelete
            ? undefined
            : JSON.stringify({
                id: pendingAction.user.id,
                status: nextStatus,
              }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(
          data.message ||
            (isDelete ? 'Unable to delete user' : 'Unable to update status'),
        );
      }

      if (selectedUser?.id === pendingAction.user.id) {
        closeUserDetails();
      }
      setPendingAction(null);
      setDeleteConfirmation('');
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to complete this action',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers =
    flowFilter === 'all'
      ? users
      : users.filter((user) => {
          if (flowFilter === 'create-ai') return Boolean(user.flows?.createAi);
          if (flowFilter === 'redesign') return Boolean(user.flows?.redesign);
          return Boolean(user.flows?.createCustom);
        });

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <CardBox
            key={card.key}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#0b0b0b]/80"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats[card.key].toLocaleString('en-IN')}
                </p>
              </div>
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.background} ${card.color}`}
              >
                <Icon icon={card.icon} width={25} />
              </span>
            </div>
          </CardBox>
        ))}
      </div>

      <CardBox className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-0 shadow-sm dark:border-white/5 dark:bg-[#0b0b0b]/80 dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 dark:border-white/5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[20px] font-bold text-gray-900 dark:text-white">
                Registered Users
              </h1>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                Live database
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Real customer accounts registered through the website builder.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <label className="relative min-w-0 flex-1 lg:w-80">
              <span className="sr-only">Search users</span>
              <Icon
                icon="solar:magnifer-linear"
                width={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#e53935] focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/[0.08]"
              />
            </label>
            <select
              value={flowFilter}
              onChange={(event) =>
                setFlowFilter(event.target.value as FlowFilter)
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
              aria-label="Filter by builder flow"
            >
              <option value="all">All flows</option>
              <option value="create-ai">Create with AI</option>
              <option value="create-custom">Create Custom</option>
              <option value="redesign">Redesign</option>
            </select>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10"
            >
              <Icon
                icon="solar:refresh-bold-duotone"
                width={18}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="min-h-[420px] w-full overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/5 dark:bg-white/[0.035]">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Websites
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Published / Draft
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Joined
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-5">
                          <div className="h-4 rounded-full bg-gray-100 dark:bg-white/[0.07]" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.035]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-[13.5px] font-semibold text-gray-900 dark:text-white">
                              {user.name || 'Unnamed user'}
                            </p>
                            <p className="mt-0.5 max-w-[180px] truncate font-mono text-[10px] text-gray-400">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13.5px] text-gray-600 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            user.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.status === 'Active'
                                ? 'bg-emerald-500'
                                : 'bg-red-500'
                            }`}
                          />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                          {user.websiteCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {user.publishedWebsiteCount} published
                          </span>
                          <span className="text-gray-300 dark:text-gray-700">/</span>
                          <span className="text-amber-600 dark:text-amber-400">
                            {user.draftWebsiteCount} draft
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => void openUserDetails(user)}
                            title="View user details"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                          >
                            <Icon icon="solar:eye-bold-duotone" width={19} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openAction('status', user)}
                            title={
                              user.status === 'Active'
                                ? 'Make user inactive'
                                : 'Activate user'
                            }
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                              user.status === 'Active'
                                ? 'border-gray-200 text-gray-400 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-white/10 dark:hover:border-amber-500/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-400'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                            }`}
                          >
                            <Icon
                              icon={
                                user.status === 'Active'
                                  ? 'solar:user-block-rounded-bold-duotone'
                                  : 'solar:user-check-rounded-bold-duotone'
                              }
                              width={19}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => openAction('delete', user)}
                            title="Delete user"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          >
                            <Icon
                              icon="solar:trash-bin-trash-bold-duotone"
                              width={19}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!loading && error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#e53935] dark:bg-red-500/10">
                <Icon icon="solar:danger-triangle-bold-duotone" width={28} />
              </span>
              <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                Users could not be loaded
              </h2>
              <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
                className="mt-5 rounded-xl bg-[#e53935] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c22028]"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !error && users.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5">
                <Icon icon="solar:users-group-rounded-bold-duotone" width={28} />
              </span>
              <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                {search ? 'No matching users found' : 'No registered users yet'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {search
                  ? 'Try searching with another name or email address.'
                  : 'New customer registrations will appear here automatically.'}
              </p>
            </div>
          ) : null}
        </div>

        {!loading && !error && users.length > 0 ? (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-xs text-gray-500 dark:border-white/5 dark:text-gray-400">
            <span>
              Showing {users.length} {search ? 'matching' : 'registered'} user
              {users.length === 1 ? '' : 's'}
            </span>
            <span>Data updates from the live database</span>
          </div>
        ) : null}
      </CardBox>

      {selectedUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-details-title"
        >
          <button
            type="button"
            aria-label="Close user details"
            className="absolute inset-0"
            onClick={closeUserDetails}
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515]">
            <div className="relative shrink-0 overflow-hidden bg-[linear-gradient(125deg,#0f172a_0%,#111827_52%,#312e81_100%)] px-6 py-6 text-white sm:px-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-red-500/15 blur-3xl"
              />
              <button
                type="button"
                aria-label="Close"
                onClick={closeUserDetails}
                className="absolute right-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Icon icon="solar:close-circle-bold" width={22} />
              </button>
              <div className="relative flex flex-col gap-5 pr-10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar user={selectedUser} size="large" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2
                        id="user-details-title"
                        className="text-2xl font-bold text-white"
                      >
                        {selectedUser.name || 'Unnamed user'}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selectedUser.status === 'Active'
                              ? 'bg-emerald-300'
                              : 'bg-amber-300'
                          }`}
                        />
                        {selectedUser.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/75">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[
                    ['Websites', selectedUser.websiteCount],
                    ['Published', selectedUser.publishedWebsiteCount],
                    ['Drafts', selectedUser.draftWebsiteCount],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="min-w-20 rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-center backdrop-blur"
                    >
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm dark:border-white/5 dark:bg-white/[0.03] sm:grid-cols-3 sm:p-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    User ID
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-gray-700 dark:text-gray-300">
                    {selectedUser.id}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Registered
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-800 dark:text-gray-200">
                    {formatDateTime(selectedUser.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Last activity
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-800 dark:text-gray-200">
                    {formatDateTime(selectedUser.lastUpdatedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                {(
                  [
                    ['Active plans', selectedUser.billingSummary?.activePlans ?? selectedUser.plans?.filter((p) => p.status === 'active').length ?? 0, 'plans'],
                    ['Active addons', selectedUser.billingSummary?.activeAddons ?? selectedUser.addons?.filter((a) => a.status === 'active').length ?? 0, 'addons'],
                    ['Exports', selectedUser.billingSummary?.exportPurchases ?? selectedUser.exports?.length ?? 0, 'downloads'],
                    ['Domains', selectedUser.billingSummary?.domains ?? selectedUser.domains?.length ?? 0, 'domains'],
                    ['Connections', selectedUser.billingSummary?.domainConnections ?? selectedUser.domainConnections?.length ?? 0, 'domains'],
                    [
                      'Create AI',
                      selectedUser.billingSummary?.createAiDesigns ??
                        selectedUser.createAiDesignCount ??
                        selectedUser.createAiDesigns?.length ??
                        0,
                      'create-ai',
                    ],
                  ] as const
                ).map(([label, value, tab]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDetailsTab(tab)}
                    className={`rounded-xl border px-3 py-3 text-center transition ${
                      detailsTab === tab
                        ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10'
                        : 'border-gray-100 bg-white hover:border-gray-200 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20'
                    }`}
                  >
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {detailsLoading ? '…' : value}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {label}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/[0.03]">
                {(
                  [
                    ['overview', 'Overview'],
                    ['websites', 'Websites'],
                    ['create-ai', 'Create AI'],
                    ['plans', 'Plans'],
                    ['addons', 'Add-ons'],
                    ['downloads', 'Downloads'],
                    ['domains', 'Domains'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDetailsTab(id)}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      detailsTab === id
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-[#1f1f1f] dark:text-white'
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {detailsTab === 'overview' ? (
                <div className="mt-5 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Name
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedUser.name?.trim() || '—'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Email
                      </p>
                      <a
                        href={`mailto:${selectedUser.email}`}
                        className="mt-2 block break-all text-sm font-semibold text-primary"
                      >
                        {selectedUser.email}
                      </a>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Phone
                      </p>
                      {selectedUser.phone?.trim() ? (
                        <a
                          href={`tel:${selectedUser.phone.trim()}`}
                          className="mt-2 block text-sm font-semibold text-primary"
                        >
                          {selectedUser.phone.trim()}
                        </a>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                          —
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedUser.birthday?.trim() ? (
                      <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Date of birth
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedUser.birthday.trim()}
                        </p>
                      </div>
                    ) : null}
                    <div
                      className={`rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025] ${
                        selectedUser.birthday?.trim() ? '' : 'sm:col-span-2'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Address
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedUser.address?.trim() || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {detailsTab === 'plans' ? (
              <section className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
                      Billing & plans
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      Current plans
                    </h3>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    {selectedUser.plans?.length ?? 0} total
                  </span>
                </div>

                {!detailsLoading && selectedUser.sites.length ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-4 dark:border-white/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Assign Core plan
                    </p>
                    {(() => {
                      const activeSiteIds = new Set(
                        (selectedUser.plans || [])
                          .filter((plan) => plan.status === 'active' && plan.siteId)
                          .map((plan) => plan.siteId),
                      );
                      const assignableSites = selectedUser.sites.filter(
                        (site) => !activeSiteIds.has(site.id),
                      );
                      const selectedAssignId =
                        assignSiteId &&
                        assignableSites.some((site) => site.id === assignSiteId)
                          ? assignSiteId
                          : assignableSites[0]?.id || '';

                      if (!assignableSites.length) {
                        return (
                          <p className="mt-3 text-xs font-semibold text-gray-500">
                            All sites already have an active Core plan. Renewals
                            happen when the user pays; use{' '}
                            <span className="text-rose-600">Cancel</span> only
                            to revoke access.
                          </p>
                        );
                      }

                      return (
                        <>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <select
                              value={selectedAssignId}
                              onChange={(event) =>
                                setAssignSiteId(event.target.value)
                              }
                              className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                            >
                              {assignableSites.map((site) => (
                                <option key={site.id} value={site.id}>
                                  {site.title}
                                </option>
                              ))}
                            </select>
                            <select
                              value={assignCycle}
                              onChange={(event) =>
                                setAssignCycle(
                                  event.target.value === 'yearly'
                                    ? 'yearly'
                                    : 'monthly',
                                )
                              }
                              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                            >
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                            <button
                              type="button"
                              disabled={Boolean(planBusyKey) || !selectedAssignId}
                              onClick={() =>
                                void runPlanAction({
                                  action: 'assign',
                                  siteId: selectedAssignId,
                                  cycle: assignCycle,
                                })
                              }
                              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {planBusyKey.startsWith('assign:')
                                ? 'Assigning…'
                                : 'Assign Core'}
                            </button>
                          </div>
                          {planError ? (
                            <p className="mt-2 text-xs font-semibold text-red-600">
                              {planError}
                            </p>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                ) : null}

                {detailsLoading ? (
                  <div className="mt-4 h-24 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.035]" />
                ) : selectedUser.plans?.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedUser.plans.map((plan) => (
                      <div
                        key={`${plan.siteId}-${plan.planId}-${plan.upgradedAt || 'x'}`}
                        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold capitalize text-gray-900 dark:text-white">
                              {plan.planId} {plan.cycle ? `(${plan.cycle})` : ''}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {plan.siteTitle || plan.siteId || 'No site linked'}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(plan.status)}`}>
                            {plan.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                          <p>Upgraded: {formatOptionalDate(plan.upgradedAt)}</p>
                          <p>Expires: {formatOptionalDate(plan.expiresAt)}</p>
                          <p className="truncate">Payment: {plan.paymentId || '—'}</p>
                          <p className="truncate">Order: {plan.orderId || '—'}</p>
                        </div>
                        {plan.siteId && plan.status === 'active' ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={Boolean(planBusyKey)}
                              onClick={() => {
                                setPlanError('');
                                setPendingPlanCancel({
                                  siteId: plan.siteId,
                                  siteTitle:
                                    plan.siteTitle || plan.siteId || 'this site',
                                });
                              }}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10">
                    No plan purchases yet.
                  </p>
                )}
              </section>
              ) : null}

              {detailsTab === 'addons' ? (
              <section className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
                      Add-ons
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      Purchased add-ons
                    </h3>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    {selectedUser.addons?.length ?? 0} total
                  </span>
                </div>
                {detailsLoading ? (
                  <div className="mt-4 h-24 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.035]" />
                ) : selectedUser.addons?.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedUser.addons.map((addon, index) => (
                      <div
                        key={`${addon.addonId}-${addon.siteId}-${addon.purchasedAt || index}`}
                        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {addon.label}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {addon.siteTitle || addon.siteId || 'Account level'}
                              {addon.cycle ? ` · ${addon.cycle}` : ''}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(addon.status)}`}>
                            {addon.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                          <p>Purchased: {formatOptionalDate(addon.purchasedAt)}</p>
                          <p>Expires: {formatOptionalDate(addon.expiresAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10">
                    No add-ons purchased.
                  </p>
                )}
              </section>
              ) : null}

              {detailsTab === 'downloads' ? (
              <section className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
                      Website downloads
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      Export / download credits
                    </h3>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    {selectedUser.exports?.length ?? 0} total
                  </span>
                </div>
                {detailsLoading ? (
                  <div className="mt-4 h-24 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.035]" />
                ) : selectedUser.exports?.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedUser.exports.map((item, index) => (
                      <div
                        key={`${item.format}-${item.siteId}-${item.purchasedAt || index}`}
                        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold uppercase text-gray-900 dark:text-white">
                              {item.format} export
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {item.siteTitle || item.siteId || 'Website'}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                          <p>
                            Downloads left: {item.downloadsRemaining}/{item.downloadsMax}
                          </p>
                          <p>Purchased: {formatOptionalDate(item.purchasedAt)}</p>
                          <p>
                            Amount:{' '}
                            {item.amountInr != null
                              ? `₹${item.amountInr.toLocaleString('en-IN')}`
                              : '—'}
                          </p>
                          <p className="truncate">Payment: {item.paymentId || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10">
                    No website export purchases.
                  </p>
                )}
              </section>
              ) : null}

              {detailsTab === 'domains' ? (
              <>
              <section className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
                      Domains
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      Purchased domains
                    </h3>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    {selectedUser.domains?.length ?? 0} total
                  </span>
                </div>
                {detailsLoading ? (
                  <div className="mt-4 h-24 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.035]" />
                ) : selectedUser.domains?.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedUser.domains.map((domain, index) => (
                      <div
                        key={domain.id || `${domain.domain}-${index}`}
                        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {domain.domain}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {domain.siteTitle || domain.siteId || 'Unassigned'}
                              {domain.price ? ` · ${domain.price}` : ''}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(domain.status)}`}>
                            {domain.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                          <p>Purchased: {formatOptionalDate(domain.purchasedAt)}</p>
                          <p>Expires: {formatOptionalDate(domain.expiresAt)}</p>
                          <p>Auto-renew: {domain.autoRenew ? 'Yes' : 'No'}</p>
                          <p>Connection: {domain.connectionStatus || '—'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10">
                    No domains purchased.
                  </p>
                )}
              </section>

              <section className="mt-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
                      Third-party / custom DNS
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      Domain connections
                    </h3>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    {selectedUser.domainConnections?.length ?? 0} total
                  </span>
                </div>
                {detailsLoading ? (
                  <div className="mt-4 h-24 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.035]" />
                ) : selectedUser.domainConnections?.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedUser.domainConnections.map((connection, index) => (
                      <div
                        key={connection.id || `${connection.domain}-${index}`}
                        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {connection.domain}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {connection.siteTitle || connection.siteId || 'Unassigned'}
                              {connection.method ? ` · ${connection.method}` : ''}
                            </p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(connection.status || 'pending')}`}>
                            {connection.status || 'pending'}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                          <p>Created: {formatOptionalDate(connection.createdAt)}</p>
                          <p>Verified: {formatOptionalDate(connection.verifiedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10">
                    No third-party domain connections.
                  </p>
                )}
              </section>
              </>
              ) : null}

              {detailsTab === 'create-ai' ? (
              <section className="mt-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
                      Create with AI
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      Synced AI designs
                    </h3>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                    {selectedUser.createAiDesigns?.length ?? 0} total
                  </span>
                </div>
                {detailsLoading ? (
                  <div className="mt-4 h-24 animate-pulse rounded-2xl bg-gray-50 dark:bg-white/[0.035]" />
                ) : selectedUser.createAiDesigns?.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedUser.createAiDesigns.map((design) => (
                      <div
                        key={design.id}
                        className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {design.title || design.brandName || design.designKey}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-gray-400">
                              {design.designKey}
                            </p>
                          </div>
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                            {design.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                          <p>Category: {design.category || '—'}</p>
                          <p>Pages: {design.pageCount}</p>
                          <p>Type: {design.pageType || '—'}</p>
                          <p>Synced: {formatDateTime(design.lastSyncedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10">
                    No Create-AI designs synced yet. User must be logged in while
                    editing a ca_… design.
                  </p>
                )}
              </section>
              ) : null}

              {detailsTab === 'websites' ? (
              <>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e53935]">
                    Website history
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    Websites created by this user
                  </h3>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  {selectedUser.websiteCount} total
                </span>
              </div>

              {detailsLoading ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {Array.from({ length: Math.max(selectedUser.websiteCount, 2) }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="h-64 animate-pulse rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-white/[0.035]"
                      />
                    ),
                  )}
                </div>
              ) : detailsError ? (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-6 text-center dark:border-red-500/10 dark:bg-red-500/5">
                  <Icon
                    icon="solar:danger-triangle-bold-duotone"
                    width={28}
                    className="mx-auto text-red-500"
                  />
                  <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                    {detailsError}
                  </p>
                  <button
                    type="button"
                    onClick={() => void openUserDetails(selectedUser)}
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Try again
                  </button>
                </div>
              ) : selectedUser.sites.length ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {selectedUser.sites.map((site) => {
                    const publicUrl = `${FRONTEND_URL}/published/${site.slug}`;
                    return (
                      <article
                        key={site.id}
                        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50/80 p-5 dark:border-white/5 dark:bg-white/[0.025]">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                              <Icon
                                icon="solar:global-bold-duotone"
                                width={22}
                              />
                            </span>
                            <div className="min-w-0">
                              <h4 className="truncate text-base font-bold text-gray-900 dark:text-white">
                                {site.title}
                              </h4>
                              <p className="mt-0.5 truncate font-mono text-[10px] text-gray-400">
                                {site.id}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              site.published
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                            }`}
                          >
                            {site.published ? 'Published' : 'Draft'}
                          </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${flowBadgeClass(site.flow)}`}
                              title={site.flow || 'unlabeled'}
                            >
                              {site.flowLabel || 'Unlabeled'}
                          </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Category
                              </p>
                              <p className="mt-1 font-semibold text-gray-800 dark:text-gray-200">
                                {site.category}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Template
                              </p>
                              <p className="mt-1 break-all font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                                {site.templateId}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Created
                              </p>
                              <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                                {formatDateTime(site.createdAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Last updated
                              </p>
                              <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                                {formatDateTime(site.updatedAt)}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Published at
                              </p>
                              <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                                {site.publishedAt
                                  ? formatDateTime(site.publishedAt)
                                  : 'Not published yet'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-black/20">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                              Website URL
                            </p>
                            {site.published ? (
                              <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                <span className="truncate">{publicUrl}</span>
                                <Icon
                                  icon="solar:square-arrow-right-up-bold-duotone"
                                  width={17}
                                  className="shrink-0"
                                />
                              </a>
                            ) : (
                              <p className="mt-1.5 truncate text-xs text-gray-400">
                                {publicUrl} (not live)
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-white/10">
                  <Icon
                    icon="solar:global-bold-duotone"
                    width={30}
                    className="mx-auto text-gray-300 dark:text-gray-600"
                  />
                  <p className="mt-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    This user has not created a website yet.
                  </p>
                </div>
              )}
              </>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-[#151515] sm:px-8">
              <button
                type="button"
                onClick={closeUserDetails}
                className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingPlanCancel ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-plan-cancel-title"
        >
          <button
            type="button"
            aria-label="Close cancel plan dialog"
            className="absolute inset-0"
            disabled={Boolean(planBusyKey)}
            onClick={() => setPendingPlanCancel(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#171717] sm:p-7">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
              <Icon icon="solar:card-recive-bold-duotone" width={32} />
            </span>
            <h2
              id="confirm-plan-cancel-title"
              className="mt-5 text-xl font-bold text-gray-900 dark:text-white"
            >
              Cancel Core plan?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Core access for{' '}
              <strong className="text-gray-800 dark:text-gray-200">
                {pendingPlanCancel.siteTitle}
              </strong>{' '}
              will end immediately. Renewals later will need a new payment or
              Assign Core.
            </p>
            {planError ? (
              <p className="mt-3 text-xs font-semibold text-red-600">{planError}</p>
            ) : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={Boolean(planBusyKey)}
                onClick={() => setPendingPlanCancel(null)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
              >
                Keep plan
              </button>
              <button
                type="button"
                disabled={Boolean(planBusyKey)}
                onClick={() => {
                  const siteId = pendingPlanCancel.siteId;
                  void (async () => {
                    const ok = await runPlanAction({
                      action: 'cancel',
                      siteId,
                    });
                    if (ok) setPendingPlanCancel(null);
                  })();
                }}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {planBusyKey.startsWith('cancel:')
                  ? 'Cancelling…'
                  : 'Yes, cancel plan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingAction ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-user-action-title"
        >
          <button
            type="button"
            aria-label="Cancel action"
            className="absolute inset-0"
            disabled={actionLoading}
            onClick={closePendingAction}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#171717] sm:p-7">
            <span
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                pendingAction.type === 'delete'
                  ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                  : pendingAction.user.status === 'Active'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}
            >
              <Icon
                icon={
                  pendingAction.type === 'delete'
                    ? 'solar:trash-bin-trash-bold-duotone'
                    : pendingAction.user.status === 'Active'
                      ? 'solar:user-block-rounded-bold-duotone'
                      : 'solar:user-check-rounded-bold-duotone'
                }
                width={32}
              />
            </span>

            <h2
              id="confirm-user-action-title"
              className="mt-5 text-xl font-bold text-gray-900 dark:text-white"
            >
              {pendingAction.type === 'delete'
                ? 'Delete this user?'
                : pendingAction.user.status === 'Active'
                  ? 'Make user inactive?'
                  : 'Activate this user?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
              {pendingAction.type === 'delete' ? (
                <>
                  <strong className="text-gray-800 dark:text-gray-200">
                    {pendingAction.user.name || pendingAction.user.email}
                  </strong>{' '}
                  and all {pendingAction.user.websiteCount} owned website
                  {pendingAction.user.websiteCount === 1 ? '' : 's'} will be
                  permanently deleted. This cannot be undone.
                </>
              ) : pendingAction.user.status === 'Active' ? (
                <>
                  <strong className="text-gray-800 dark:text-gray-200">
                    {pendingAction.user.name || pendingAction.user.email}
                  </strong>{' '}
                  will immediately lose access and cannot log in until the
                  account is activated again.
                </>
              ) : (
                <>
                  <strong className="text-gray-800 dark:text-gray-200">
                    {pendingAction.user.name || pendingAction.user.email}
                  </strong>{' '}
                  will be able to log in and access owned websites again.
                </>
              )}
            </p>

            {pendingAction.type === 'delete' ? (
              <div className="mt-5 text-left">
                <label
                  htmlFor="delete-user-confirmation"
                  className="block text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  Type{' '}
                  <code className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    {DELETE_CONFIRMATION_TEXT}
                  </code>{' '}
                  to confirm
                </label>
                <input
                  id="delete-user-confirmation"
                  autoFocus
                  type="text"
                  value={deleteConfirmation}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => {
                    setDeleteConfirmation(event.target.value);
                    setActionError('');
                  }}
                  placeholder={DELETE_CONFIRMATION_TEXT}
                  className="mt-2.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder:text-gray-600 dark:focus:border-red-500"
                />
              </div>
            ) : null}

            {actionError ? (
              <p
                className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400"
                role="alert"
              >
                {actionError}
              </p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={closePendingAction}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
              >
                Cancel
              </button>
              <div
                className={`flex-1 ${
                  actionLoading ||
                  (pendingAction.type === 'delete' &&
                    deleteConfirmation !== DELETE_CONFIRMATION_TEXT)
                    ? 'cursor-not-allowed'
                    : ''
                }`}
                title={
                  pendingAction.type === 'delete' &&
                  deleteConfirmation !== DELETE_CONFIRMATION_TEXT
                    ? `Type ${DELETE_CONFIRMATION_TEXT} to enable deletion`
                    : undefined
                }
              >
                <button
                  type="button"
                  disabled={
                    actionLoading ||
                    (pendingAction.type === 'delete' &&
                      deleteConfirmation !== DELETE_CONFIRMATION_TEXT)
                  }
                  onClick={() => void confirmAction()}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition disabled:pointer-events-none disabled:opacity-60 ${
                    pendingAction.type === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : pendingAction.user.status === 'Active'
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoading
                    ? 'Please wait...'
                    : pendingAction.type === 'delete'
                      ? 'Yes, delete'
                      : pendingAction.user.status === 'Active'
                        ? 'Make inactive'
                        : 'Activate user'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
