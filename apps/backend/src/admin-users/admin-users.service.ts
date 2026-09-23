import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Rolling Mon–Sun weeks so the growth chart shows recent activity,
    // not an empty calendar month when sites were created earlier.
    const WEEK_COUNT = 6;
    const msPerDay = 24 * 60 * 60 * 1000;
    const mondayOffset = (now.getDay() + 6) % 7;
    const startOfThisWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - mondayOffset,
    );
    startOfThisWeek.setHours(0, 0, 0, 0);
    const weeklyWindowStart = new Date(startOfThisWeek);
    weeklyWindowStart.setDate(
      weeklyWindowStart.getDate() - (WEEK_COUNT - 1) * 7,
    );

    const [
      totalUsers,
      totalSites,
      usersThisMonth,
      sitesThisMonthCount,
      sitesInWeeklyWindow,
      sitesCreatedThisMonth,
      publishedSites,
      usersWithBilling,
      openSupportTickets,
      supportTicketsThisMonth,
      allSitesForFlow,
      createAiDesignCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.site.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
      }),
      this.prisma.site.count({
        where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
      }),
      this.prisma.site.findMany({
        where: { createdAt: { gte: weeklyWindowStart } },
        select: { createdAt: true },
      }),
      this.prisma.site.findMany({
        where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } },
        select: { createdAt: true },
      }),
      this.prisma.site.findMany({
        where: { published: true },
        select: { id: true, ownerId: true, publishedAt: true, createdAt: true },
      }),
      this.prisma.user.findMany({
        select: {
          id: true,
          siteSubscriptions: true,
        },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['open', 'in_progress'] } },
      }),
      this.prisma.supportTicket.count({
        where: {
          createdAt: { gte: startOfMonth, lt: startOfNextMonth },
        },
      }),
      this.prisma.site.findMany({
        select: { id: true, config: true },
      }),
      this.prisma.createAiDesign.count(),
    ]);

    const flowBreakdown = {
      redesign: 0,
      createAi: 0,
      createCustom: 0,
      unlabeled: 0,
    };
    for (const site of allSitesForFlow) {
      const flow = this.inferSiteFlow(site.id, site.config).flow;
      if (flow === 'redesign') flowBreakdown.redesign += 1;
      else if (flow === 'create-ai') flowBreakdown.createAi += 1;
      else if (flow === 'create-custom') flowBreakdown.createCustom += 1;
      else flowBreakdown.unlabeled += 1;
    }
    // Create-AI projects live in CreateAiDesign (not always as Site rows).
    flowBreakdown.createAi = createAiDesignCount;

    let sitesForWeeklyChart = sitesInWeeklyWindow;
    let chartWindowStart = weeklyWindowStart;
    let latestSiteCreatedAt: Date | null = null;

    // If nothing was created in the last 6 weeks, still show growth by
    // anchoring the window to the most recent site activity.
    if (
      (sitesForWeeklyChart.length === 0 || sitesCreatedThisMonth.length === 0) &&
      totalSites > 0
    ) {
      const latestSite = await this.prisma.site.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      if (latestSite) {
        latestSiteCreatedAt = latestSite.createdAt;
        if (sitesForWeeklyChart.length === 0) {
          const latestMondayOffset = (latestSite.createdAt.getDay() + 6) % 7;
          const endWeekStart = new Date(
            latestSite.createdAt.getFullYear(),
            latestSite.createdAt.getMonth(),
            latestSite.createdAt.getDate() - latestMondayOffset,
          );
          endWeekStart.setHours(0, 0, 0, 0);
          chartWindowStart = new Date(endWeekStart);
          chartWindowStart.setDate(
            chartWindowStart.getDate() - (WEEK_COUNT - 1) * 7,
          );
          sitesForWeeklyChart = await this.prisma.site.findMany({
            where: { createdAt: { gte: chartWindowStart } },
            select: { createdAt: true },
          });
        }
      }
    }

    const aiInstantWeeklyOrders = Array.from({ length: WEEK_COUNT }, (_, index) => ({
      name: `Week ${index + 1}`,
      orders: 0,
    }));
    for (const site of sitesForWeeklyChart) {
      const daysFromStart = Math.floor(
        (site.createdAt.getTime() - chartWindowStart.getTime()) / msPerDay,
      );
      const weekIndex = Math.min(
        WEEK_COUNT - 1,
        Math.max(0, Math.floor(daysFromStart / 7)),
      );
      const week = aiInstantWeeklyOrders[weekIndex];
      if (week) week.orders += 1;
    }

    // Daily website orders for the overview area chart (this month, or
    // the month of latest activity when the current month is empty).
    let overviewMonthStart = startOfMonth;
    let overviewMonthEnd = startOfNextMonth;
    let sitesForDailyChart = sitesCreatedThisMonth;
    if (sitesForDailyChart.length === 0 && latestSiteCreatedAt) {
      overviewMonthStart = new Date(
        latestSiteCreatedAt.getFullYear(),
        latestSiteCreatedAt.getMonth(),
        1,
      );
      overviewMonthEnd = new Date(
        latestSiteCreatedAt.getFullYear(),
        latestSiteCreatedAt.getMonth() + 1,
        1,
      );
      sitesForDailyChart = await this.prisma.site.findMany({
        where: {
          createdAt: { gte: overviewMonthStart, lt: overviewMonthEnd },
        },
        select: { createdAt: true },
      });
    }

    const monthShort = overviewMonthStart.toLocaleString('en-GB', {
      month: 'short',
    });
    const daysInOverviewMonth = new Date(
      overviewMonthStart.getFullYear(),
      overviewMonthStart.getMonth() + 1,
      0,
    ).getDate();
    const isCurrentOverviewMonth =
      overviewMonthStart.getFullYear() === now.getFullYear() &&
      overviewMonthStart.getMonth() === now.getMonth();
    const lastDayToShow = isCurrentOverviewMonth
      ? Math.max(1, now.getDate())
      : daysInOverviewMonth;

    const websiteOrdersOverview = Array.from(
      { length: lastDayToShow },
      (_, index) => ({
        name: `${index + 1} ${monthShort}`,
        orders: 0,
      }),
    );
    for (const site of sitesForDailyChart) {
      const day = site.createdAt.getDate();
      const point = websiteOrdersOverview[day - 1];
      if (point) point.orders += 1;
    }
    const websiteOrdersMonthLabel = overviewMonthStart.toLocaleString('en-GB', {
      month: 'short',
      year: 'numeric',
    });

    const activeSiteIds = new Set<string>();
    let activeSubscriptions = 0;
    let activeSubscriptionsThisMonth = 0;

    for (const user of usersWithBilling) {
      const subscriptions = this.asSubscriptionMap(user.siteSubscriptions);
      for (const subscription of Object.values(subscriptions)) {
        if (!this.isActiveCoreSubscription(subscription, now)) continue;
        const siteId = subscription.siteId;
        if (!siteId) continue;
        activeSubscriptions += 1;
        activeSiteIds.add(siteId);
        const upgradedAt = subscription.upgradedAt
          ? new Date(subscription.upgradedAt)
          : null;
        if (
          upgradedAt &&
          upgradedAt >= startOfMonth &&
          upgradedAt < startOfNextMonth
        ) {
          activeSubscriptionsThisMonth += 1;
        }
      }
    }

    let pendingPayments = 0;
    let pendingPaymentsThisMonth = 0;
    for (const site of publishedSites) {
      if (activeSiteIds.has(site.id)) continue;
      pendingPayments += 1;
      const stamped = site.publishedAt || site.createdAt;
      if (stamped >= startOfMonth && stamped < startOfNextMonth) {
        pendingPaymentsThisMonth += 1;
      }
    }

    return {
      totalUsers,
      totalSites,
      usersThisMonth,
      sitesThisMonth: sitesThisMonthCount,
      aiInstantWeeklyOrders,
      websiteOrdersOverview,
      websiteOrdersMonthLabel,
      pendingPayments,
      pendingPaymentsThisMonth,
      activeSubscriptions,
      activeSubscriptionsThisMonth,
      supportTickets: openSupportTickets,
      supportTicketsThisMonth,
      flowBreakdown,
    };
  }

  private asConfigRecord(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null as Record<string, unknown> | null;
    }
    return value as Record<string, unknown>;
  }

  private inferSiteFlow(
    siteId: string,
    config: Prisma.JsonValue | null | undefined,
  ): { flow: string; flowLabel: string } {
    const cfg = this.asConfigRecord(config);
    const stamped =
      typeof cfg?.createPath === 'string' ? cfg.createPath.trim().toLowerCase() : '';
    if (stamped === 'redesign') {
      return { flow: 'redesign', flowLabel: 'Redesign' };
    }
    if (stamped === 'create-ai') {
      return { flow: 'create-ai', flowLabel: 'Create with AI' };
    }
    if (stamped === 'create-custom') {
      return { flow: 'create-custom', flowLabel: 'Create Custom' };
    }
    const designId =
      typeof cfg?.designId === 'string' ? cfg.designId.trim() : '';
    if (/^rd_/i.test(siteId) || /^rd_/i.test(designId)) {
      return { flow: 'redesign', flowLabel: 'Redesign' };
    }
    if (/^ca_/i.test(siteId) || /^ca_/i.test(designId)) {
      return { flow: 'create-ai', flowLabel: 'Create with AI' };
    }
    // Editor DB sites historically had no createPath stamp; default Create Custom
    // (redesign/create-ai are detected above via stamp or rd_/ca_ ids).
    return { flow: 'create-custom', flowLabel: 'Create Custom' };
  }

  private asSubscriptionMap(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {} as Record<
        string,
        {
          siteId?: string;
          siteTitle?: string;
          siteSlug?: string;
          planId?: string;
          cycle?: string;
          paymentId?: string;
          orderId?: string;
          upgradedAt?: string;
          expiresAt?: string;
        }
      >;
    }

    const result: Record<
      string,
      {
        siteId?: string;
        siteTitle?: string;
        siteSlug?: string;
        planId?: string;
        cycle?: string;
        paymentId?: string;
        orderId?: string;
        upgradedAt?: string;
        expiresAt?: string;
      }
    > = {};

    for (const [siteId, raw] of Object.entries(value as Record<string, unknown>)) {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      const item = raw as Record<string, unknown>;
      result[siteId] = {
        siteId: typeof item.siteId === 'string' ? item.siteId : siteId,
        siteTitle:
          typeof item.siteTitle === 'string' ? item.siteTitle : undefined,
        siteSlug: typeof item.siteSlug === 'string' ? item.siteSlug : undefined,
        planId: typeof item.planId === 'string' ? item.planId : undefined,
        cycle: typeof item.cycle === 'string' ? item.cycle : undefined,
        paymentId:
          typeof item.paymentId === 'string' ? item.paymentId : undefined,
        orderId: typeof item.orderId === 'string' ? item.orderId : undefined,
        upgradedAt:
          typeof item.upgradedAt === 'string' ? item.upgradedAt : undefined,
        expiresAt:
          typeof item.expiresAt === 'string' ? item.expiresAt : undefined,
      };
    }
    return result;
  }

  private isActiveCoreSubscription(
    subscription: {
      siteId?: string;
      planId?: string;
      paymentId?: string;
      orderId?: string;
      expiresAt?: string;
    },
    now: Date,
  ) {
    if (!subscription.siteId || subscription.planId !== 'core') return false;
    if (
      subscription.paymentId?.startsWith('pay_mock_') ||
      subscription.orderId?.startsWith('order_mock_')
    ) {
      return false;
    }
    if (subscription.expiresAt) {
      return new Date(subscription.expiresAt).getTime() > now.getTime();
    }
    return true;
  }

  async findAll(search?: string) {
    const query = search?.trim();
    const where: Prisma.UserWhereInput | undefined = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const [
      users,
      totalUsers,
      activeUsers,
      totalSites,
      publishedSites,
      publishedByOwner,
      latestSiteUpdateByOwner,
    ] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { sites: true, createAiDesigns: true } },
            sites: {
              select: { id: true, config: true },
            },
          },
        }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: 'Active' } }),
        this.prisma.site.count(),
        this.prisma.site.count({ where: { published: true } }),
        this.prisma.site.groupBy({
          by: ['ownerId'],
          where: { published: true },
          _count: { _all: true },
        }),
        this.prisma.site.groupBy({
          by: ['ownerId'],
          _max: { updatedAt: true },
        }),
      ]);

    const publishedCountByOwner = new Map(
      publishedByOwner.map((row) => [row.ownerId, row._count._all]),
    );
    const latestSiteUpdateMap = new Map(
      latestSiteUpdateByOwner.map((row) => [row.ownerId, row._max.updatedAt]),
    );

    return {
      users: users.map(({ _count, sites: rawSites, ...user }) => {
        const websiteCount = _count.sites;
        const publishedWebsiteCount = publishedCountByOwner.get(user.id) ?? 0;
        const latestSiteUpdate = latestSiteUpdateMap.get(user.id);
        const lastUpdatedAt =
          latestSiteUpdate && latestSiteUpdate > user.updatedAt
            ? latestSiteUpdate
            : user.updatedAt;

        let hasRedesign = false;
        let hasCreateCustom = false;
        let hasCreateAiSite = false;
        for (const site of rawSites) {
          const flow = this.inferSiteFlow(site.id, site.config).flow;
          if (flow === 'redesign') hasRedesign = true;
          else if (flow === 'create-ai') hasCreateAiSite = true;
          else if (flow === 'create-custom') hasCreateCustom = true;
        }
        const createAiDesignCount = _count.createAiDesigns;
        const hasCreateAi = createAiDesignCount > 0 || hasCreateAiSite;

        return {
          ...user,
          lastUpdatedAt,
          websiteCount,
          publishedWebsiteCount,
          draftWebsiteCount: websiteCount - publishedWebsiteCount,
          createAiDesignCount,
          flows: {
            redesign: hasRedesign,
            createAi: hasCreateAi,
            createCustom: hasCreateCustom,
          },
        };
      }),
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalSites,
        publishedSites,
        draftSites: totalSites - publishedSites,
      },
    };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        address: true,
        birthday: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        siteSubscriptions: true,
        purchasedAddons: true,
        purchasedDomains: true,
        domainConnections: true,
        sites: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            templateId: true,
            category: true,
            published: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            config: true,
          },
        },
        createAiDesigns: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            designKey: true,
            title: true,
            brandName: true,
            category: true,
            pageType: true,
            pageCount: true,
            pageLabels: true,
            status: true,
            lastSyncedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const sites = user.sites.map(({ config, ...site }) => {
      const { flow, flowLabel } = this.inferSiteFlow(site.id, config);
      return { ...site, flow, flowLabel };
    });
    const createAiDesigns = user.createAiDesigns;

    const now = new Date();
    const siteTitleById = new Map(
      sites.map((site) => [site.id, site.title] as const),
    );
    const siteSlugById = new Map(
      sites.map((site) => [site.id, site.slug] as const),
    );

    const plans = Object.values(
      this.asSubscriptionMap(user.siteSubscriptions),
    ).map((subscription) => {
      const siteId = subscription.siteId || '';
      const active = this.isActiveCoreSubscription(subscription, now);
      const isMock =
        subscription.paymentId?.startsWith('pay_mock_') ||
        subscription.orderId?.startsWith('order_mock_') ||
        false;
      return {
        siteId,
        siteTitle: subscription.siteTitle || siteTitleById.get(siteId) || null,
        siteSlug: subscription.siteSlug || siteSlugById.get(siteId) || null,
        planId: subscription.planId || 'starter',
        cycle: subscription.cycle || null,
        paymentId: subscription.paymentId || null,
        orderId: subscription.orderId || null,
        upgradedAt: subscription.upgradedAt || null,
        expiresAt: subscription.expiresAt || null,
        status: isMock
          ? 'mock'
          : subscription.planId === 'core'
            ? active
              ? 'active'
              : 'expired'
            : 'starter',
      };
    });

    const addonRecords = this.asObjectArray(user.purchasedAddons);
    const addons: Array<{
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
    }> = [];
    const exports: Array<{
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
    }> = [];

    for (const raw of addonRecords) {
      const addonId =
        typeof raw.addonId === 'string' ? raw.addonId.trim() : '';
      if (!addonId) continue;
      const siteId = typeof raw.siteId === 'string' ? raw.siteId : '';
      const paymentId =
        typeof raw.paymentId === 'string' ? raw.paymentId : null;
      const orderId = typeof raw.orderId === 'string' ? raw.orderId : null;
      const isMock =
        paymentId?.startsWith('pay_mock_') ||
        orderId?.startsWith('order_mock_') ||
        false;
      const purchasedAt =
        typeof raw.purchasedAt === 'string' ? raw.purchasedAt : null;
      const expiresAt =
        typeof raw.expiresAt === 'string' ? raw.expiresAt : null;
      const cancelledAt =
        typeof raw.cancelledAt === 'string' ? raw.cancelledAt : null;
      const siteTitle =
        (typeof raw.siteTitle === 'string' ? raw.siteTitle : null) ||
        siteTitleById.get(siteId) ||
        null;
      const siteSlug =
        (typeof raw.siteSlug === 'string' ? raw.siteSlug : null) ||
        siteSlugById.get(siteId) ||
        null;

      if (addonId.startsWith('export-')) {
        const format = addonId.replace(/^export-/, '');
        const downloadsRemaining = Number(
          raw.creditsRemaining ?? raw.downloadsRemaining ?? 0,
        );
        const downloadsMax = Number(raw.downloadsMax ?? 5);
        exports.push({
          siteId,
          siteTitle,
          siteSlug,
          format,
          downloadsRemaining: Number.isFinite(downloadsRemaining)
            ? downloadsRemaining
            : 0,
          downloadsMax: Number.isFinite(downloadsMax) ? downloadsMax : 5,
          paymentId,
          orderId,
          purchasedAt,
          amountInr:
            typeof raw.amountInr === 'number' && Number.isFinite(raw.amountInr)
              ? raw.amountInr
              : null,
          status: isMock
            ? 'mock'
            : downloadsRemaining > 0
              ? 'available'
              : 'exhausted',
        });
        continue;
      }

      const expired =
        expiresAt != null && new Date(expiresAt).getTime() <= now.getTime();
      addons.push({
        siteId,
        siteTitle,
        siteSlug,
        addonId,
        label: this.addonLabel(addonId),
        cycle:
          typeof raw.cycle === 'string'
            ? raw.cycle
            : typeof raw.billing === 'string'
              ? raw.billing
              : null,
        paymentId,
        orderId,
        purchasedAt,
        expiresAt,
        cancelledAt,
        status: isMock
          ? 'mock'
          : cancelledAt
            ? 'cancelled'
            : expired
              ? 'expired'
              : 'active',
      });
    }

    const domains = this.asObjectArray(user.purchasedDomains).map((raw) => {
      const siteId = typeof raw.siteId === 'string' ? raw.siteId : '';
      const expiresAt =
        typeof raw.expiresAt === 'string' ? raw.expiresAt : null;
      let status =
        typeof raw.status === 'string' ? raw.status : 'active';
      if (expiresAt) {
        const expiresMs = new Date(expiresAt).getTime();
        const daysLeft = (expiresMs - now.getTime()) / (24 * 60 * 60 * 1000);
        if (expiresMs <= now.getTime()) status = 'expired';
        else if (daysLeft <= 30) status = 'expiring';
        else status = 'active';
      }
      return {
        id: typeof raw.id === 'string' ? raw.id : null,
        domain: typeof raw.domain === 'string' ? raw.domain : '—',
        status,
        purchasedAt:
          typeof raw.purchasedAt === 'string' ? raw.purchasedAt : null,
        expiresAt,
        autoRenew: Boolean(raw.autoRenew),
        price: typeof raw.price === 'string' ? raw.price : null,
        siteId,
        siteTitle:
          (typeof raw.siteTitle === 'string' ? raw.siteTitle : null) ||
          siteTitleById.get(siteId) ||
          null,
        siteSlug:
          (typeof raw.siteSlug === 'string' ? raw.siteSlug : null) ||
          siteSlugById.get(siteId) ||
          null,
        connectionStatus:
          typeof raw.connectionStatus === 'string'
            ? raw.connectionStatus
            : null,
      };
    });

    const domainConnections = this.asObjectArray(
      user.domainConnections,
    ).map((raw) => {
      const siteId = typeof raw.siteId === 'string' ? raw.siteId : '';
      return {
        id: typeof raw.id === 'string' ? raw.id : null,
        domain: typeof raw.domain === 'string' ? raw.domain : '—',
        method: typeof raw.method === 'string' ? raw.method : null,
        status: typeof raw.status === 'string' ? raw.status : null,
        siteId,
        siteTitle:
          (typeof raw.siteTitle === 'string' ? raw.siteTitle : null) ||
          siteTitleById.get(siteId) ||
          null,
        siteSlug:
          (typeof raw.siteSlug === 'string' ? raw.siteSlug : null) ||
          siteSlugById.get(siteId) ||
          null,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
        verifiedAt:
          typeof raw.verifiedAt === 'string' ? raw.verifiedAt : null,
      };
    });

    const publishedWebsiteCount = sites.filter(
      (site) => site.published,
    ).length;
    const latestSiteUpdate = sites.reduce<Date | null>(
      (latest, site) =>
        !latest || site.updatedAt > latest ? site.updatedAt : latest,
      null,
    );
    const lastUpdatedAt =
      latestSiteUpdate && latestSiteUpdate > user.updatedAt
        ? latestSiteUpdate
        : user.updatedAt;

    const {
      siteSubscriptions: _subs,
      purchasedAddons: _addons,
      purchasedDomains: _domains,
      domainConnections: _connections,
      sites: _rawSites,
      createAiDesigns: _rawCreateAi,
      ...safeUser
    } = user;

    return {
      ...safeUser,
      sites,
      createAiDesigns,
      lastUpdatedAt,
      websiteCount: sites.length,
      publishedWebsiteCount,
      draftWebsiteCount: sites.length - publishedWebsiteCount,
      createAiDesignCount: createAiDesigns.length,
      plans,
      addons,
      exports,
      domains,
      domainConnections,
      billingSummary: {
        activePlans: plans.filter((item) => item.status === 'active').length,
        activeAddons: addons.filter((item) => item.status === 'active').length,
        exportPurchases: exports.length,
        domains: domains.length,
        domainConnections: domainConnections.length,
        createAiDesigns: createAiDesigns.length,
      },
    };
  }

  async updatePlan(
    userId: string,
    body: {
      action?: string;
      siteId?: string;
      cycle?: string;
      days?: number;
    },
  ) {
    const action = body.action?.trim().toLowerCase();
    if (action !== 'assign' && action !== 'extend' && action !== 'cancel') {
      throw new BadRequestException(
        'action must be assign, extend, or cancel',
      );
    }

    const siteId = body.siteId?.trim();
    if (!siteId) {
      throw new BadRequestException('siteId is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        siteSubscriptions: true,
        sites: {
          where: { id: siteId },
          select: { id: true, title: true, slug: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const site = user.sites[0];
    if (!site) {
      throw new BadRequestException('Site not found for this user');
    }

    const map = this.asSubscriptionMap(user.siteSubscriptions);
    const existing = map[siteId] || {
      siteId,
      siteTitle: site.title,
      siteSlug: site.slug,
    };
    const now = new Date();
    const cycle =
      body.cycle === 'yearly' || body.cycle === 'monthly'
        ? body.cycle
        : existing.cycle === 'yearly'
          ? 'yearly'
          : 'monthly';

    if (action === 'cancel') {
      map[siteId] = {
        ...existing,
        siteId,
        siteTitle: existing.siteTitle || site.title,
        siteSlug: existing.siteSlug || site.slug,
        planId: existing.planId || 'core',
        cycle: existing.cycle || cycle,
        expiresAt: new Date(now.getTime() - 60_000).toISOString(),
      };
    } else if (action === 'extend') {
      const days =
        typeof body.days === 'number' && Number.isFinite(body.days)
          ? Math.min(3650, Math.max(1, Math.floor(body.days)))
          : cycle === 'yearly'
            ? 365
            : 30;
      const base =
        existing.expiresAt &&
        new Date(existing.expiresAt).getTime() > now.getTime()
          ? new Date(existing.expiresAt)
          : now;
      const expiresAt = new Date(base);
      expiresAt.setDate(expiresAt.getDate() + days);
      map[siteId] = {
        ...existing,
        siteId,
        siteTitle: existing.siteTitle || site.title,
        siteSlug: existing.siteSlug || site.slug,
        planId: 'core',
        cycle,
        paymentId:
          existing.paymentId && !existing.paymentId.startsWith('pay_mock_')
            ? existing.paymentId
            : `pay_admin_${Date.now()}`,
        orderId:
          existing.orderId && !existing.orderId.startsWith('order_mock_')
            ? existing.orderId
            : `order_admin_${Date.now()}`,
        upgradedAt: existing.upgradedAt || now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
    } else {
      // assign — never overwrite an already-active Core plan
      if (this.isActiveCoreSubscription({ ...existing, siteId }, now)) {
        throw new BadRequestException(
          'This site already has an active Core plan. Use Extend instead of Assign.',
        );
      }
      const expiresAt = new Date(now);
      if (cycle === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      map[siteId] = {
        siteId,
        siteTitle: site.title,
        siteSlug: site.slug,
        planId: 'core',
        cycle,
        paymentId: `pay_admin_${Date.now()}`,
        orderId: `order_admin_${Date.now()}`,
        upgradedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        siteSubscriptions: map as Prisma.InputJsonValue,
      },
    });

    return this.findOne(userId);
  }

  private asObjectArray(value: Prisma.JsonValue | null | undefined) {
    if (!Array.isArray(value)) return [] as Record<string, unknown>[];
    const items: Record<string, unknown>[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      items.push(item as Record<string, unknown>);
    }
    return items;
  }

  private addonLabel(addonId: string) {
    const labels: Record<string, string> = {
      'google-my-business': 'Google My Business Setup',
      'priority-support': 'Priority Support',
      'remove-branding': 'Remove Branding',
    };
    return labels[addonId] || addonId;
  }

  async updateStatus(userId: string, requestedStatus?: string) {
    const status = requestedStatus?.trim();
    if (status !== 'Active' && status !== 'Inactive') {
      throw new BadRequestException('Status must be Active or Inactive');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async remove(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id: userId } });
    return { id: userId, message: 'User deleted' };
  }
}
