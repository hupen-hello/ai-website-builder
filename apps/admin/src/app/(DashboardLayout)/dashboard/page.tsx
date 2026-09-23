'use client';

import CardBox from "@/app/components/shared/CardBox";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardSummary = {
  totalUsers: number;
  totalSites: number;
  usersThisMonth: number;
  sitesThisMonth: number;
  aiInstantWeeklyOrders: Array<{ name: string; orders: number }>;
  websiteOrdersOverview: Array<{ name: string; orders: number }>;
  websiteOrdersMonthLabel: string;
  pendingPayments: number;
  pendingPaymentsThisMonth: number;
  activeSubscriptions: number;
  activeSubscriptionsThisMonth: number;
  supportTickets: number;
  supportTicketsThisMonth: number;
  flowBreakdown?: {
    redesign: number;
    createAi: number;
    createCustom: number;
    unlabeled: number;
  };
};

const emptyWebsiteOrdersOverview = Array.from({ length: 7 }, (_, index) => ({
  name: `Day ${index + 1}`,
  orders: 0,
}));

const DashboardOverview = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadSummary = async () => {
      try {
        const response = await fetch("/api/dashboard/stats", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => ({}))) as Partial<DashboardSummary>;

        if (
          !response.ok ||
          typeof data.totalUsers !== "number" ||
          typeof data.totalSites !== "number" ||
          typeof data.usersThisMonth !== "number" ||
          typeof data.sitesThisMonth !== "number" ||
          !Array.isArray(data.aiInstantWeeklyOrders) ||
          !data.aiInstantWeeklyOrders.every(
            (item) => typeof item.name === "string" && typeof item.orders === "number",
          )
        ) {
          throw new Error("Unable to load dashboard statistics");
        }

        setSummary({
          totalUsers: data.totalUsers,
          totalSites: data.totalSites,
          usersThisMonth: data.usersThisMonth,
          sitesThisMonth: data.sitesThisMonth,
          aiInstantWeeklyOrders: data.aiInstantWeeklyOrders,
          websiteOrdersOverview:
            Array.isArray(data.websiteOrdersOverview) &&
            data.websiteOrdersOverview.every(
              (item) =>
                typeof item.name === "string" && typeof item.orders === "number",
            )
              ? data.websiteOrdersOverview
              : emptyWebsiteOrdersOverview,
          websiteOrdersMonthLabel:
            typeof data.websiteOrdersMonthLabel === "string"
              ? data.websiteOrdersMonthLabel
              : "This Month",
          pendingPayments:
            typeof data.pendingPayments === "number" ? data.pendingPayments : 0,
          pendingPaymentsThisMonth:
            typeof data.pendingPaymentsThisMonth === "number"
              ? data.pendingPaymentsThisMonth
              : 0,
          activeSubscriptions:
            typeof data.activeSubscriptions === "number"
              ? data.activeSubscriptions
              : 0,
          activeSubscriptionsThisMonth:
            typeof data.activeSubscriptionsThisMonth === "number"
              ? data.activeSubscriptionsThisMonth
              : 0,
          supportTickets:
            typeof data.supportTickets === "number" ? data.supportTickets : 0,
          supportTicketsThisMonth:
            typeof data.supportTicketsThisMonth === "number"
              ? data.supportTicketsThisMonth
              : 0,
          flowBreakdown:
            data.flowBreakdown &&
            typeof data.flowBreakdown.redesign === "number" &&
            typeof data.flowBreakdown.createAi === "number" &&
            typeof data.flowBreakdown.createCustom === "number" &&
            typeof data.flowBreakdown.unlabeled === "number"
              ? data.flowBreakdown
              : undefined,
        });
      } catch {
        if (!controller.signal.aborted) {
          setSummary(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      }
    };

    void loadSummary();
    return () => controller.abort();
  }, []);

  const liveCount = (value?: number) =>
    summaryLoading ? "..." : typeof value === "number" ? value.toLocaleString("en-IN") : "—";
  const monthlyCount = (value?: number) =>
    summaryLoading ? "..." : typeof value === "number" ? `+${value.toLocaleString("en-IN")}` : "-";
  const websiteOrdersData =
    summary?.websiteOrdersOverview ?? emptyWebsiteOrdersOverview;
  const websiteOrdersMonthLabel =
    summary?.websiteOrdersMonthLabel ?? "This Month";
  const statsData = [
    {
      title: "Total Users",
      href: "/users",
      count: liveCount(summary?.totalUsers),
      trend: monthlyCount(summary?.usersThisMonth),
      period: "This month",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:users-group-rounded-bold-duotone",
      iconClass: "bg-blue-600 shadow-blue-200 dark:shadow-blue-950",
    },
    {
      title: "Total Websites Created",
      href: "/users",
      count: liveCount(summary?.totalSites),
      trend: monthlyCount(summary?.sitesThisMonth),
      period: "This month",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:global-bold-duotone",
      iconClass: "bg-emerald-600 shadow-emerald-200 dark:shadow-emerald-950",
    },
    {
      title: "Redesign",
      href: "/users",
      count: liveCount(summary?.flowBreakdown?.redesign),
      trend: "Flow",
      period: "Saved sites",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:refresh-circle-bold-duotone",
      iconClass: "bg-sky-600 shadow-sky-200 dark:shadow-sky-950",
    },
    {
      title: "Create with AI",
      href: "/users",
      count: liveCount(summary?.flowBreakdown?.createAi),
      trend: "Flow",
      period: "AI designs synced",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:magic-stick-3-bold-duotone",
      iconClass: "bg-violet-600 shadow-violet-200 dark:shadow-violet-950",
    },
    {
      title: "Create Custom",
      href: "/users",
      count: liveCount(summary?.flowBreakdown?.createCustom),
      trend: "Flow",
      period: "Saved sites",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:widget-bold-duotone",
      iconClass: "bg-teal-600 shadow-teal-200 dark:shadow-teal-950",
    },
    {
      title: "Pending Payments",
      href: "/users",
      count: liveCount(summary?.pendingPayments),
      trend: monthlyCount(summary?.pendingPaymentsThisMonth),
      period: "This month",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:wallet-2-line-duotone",
      iconClass: "bg-amber-500 shadow-amber-200 dark:shadow-amber-950",
    },
    {
      title: "Active Subscriptions",
      href: "/users",
      count: liveCount(summary?.activeSubscriptions),
      trend: monthlyCount(summary?.activeSubscriptionsThisMonth),
      period: "This month",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:shield-check-bold",
      iconClass: "bg-emerald-600 shadow-emerald-200 dark:shadow-emerald-950",
    },
    {
      title: "Support Tickets",
      href: "/billing-support",
      count: liveCount(summary?.supportTickets),
      trend: monthlyCount(summary?.supportTicketsThisMonth),
      period: "This month",
      isPositive: Boolean(summary) || summaryLoading,
      icon: "solar:chat-round-dots-bold-duotone",
      iconClass: "bg-rose-500 shadow-rose-200 dark:shadow-rose-950",
    },
  ];

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsData.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="group relative block min-h-[132px] overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_10px_28px_rgba(15,23,42,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/5 dark:from-[#171717] dark:to-[#111827] dark:hover:border-white/10"
          >
            <div className="relative z-10 pr-20">
              <h6 className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                {stat.title}
              </h6>
              <h3 className="mt-3 text-[28px] font-bold leading-none text-slate-950 dark:text-white">
                {stat.count}
              </h3>
              <div
                className={`mt-3 flex items-center gap-1 text-[11.5px] font-semibold ${
                  stat.isPositive ? "text-emerald-500" : "text-red-500"
                }`}
              >
                <Icon
                  icon={stat.isPositive ? "solar:arrow-up-bold" : "solar:arrow-down-bold"}
                  width={12}
                />
                <span>{stat.trend}</span>
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  {stat.period}
                </span>
              </div>
            </div>
            <div
              className={`absolute right-6 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 group-hover:scale-105 ${stat.iconClass}`}
              aria-hidden="true"
            >
              <Icon icon={stat.icon} width={27} />
            </div>
          </Link>
        ))}
      </div>

      <CardBox className="bg-white dark:bg-[#0b0b0b]/80 backdrop-blur-xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] rounded-2xl p-6 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h5 className="text-[15px] font-bold text-gray-800 dark:text-white">
              Website Orders Overview
            </h5>
            <button className="text-[12.5px] font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              {websiteOrdersMonthLabel}
            </button>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={websiteOrdersData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  dy={10} 
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  dx={-10}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="orders" 
                  name="Orders"
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorOrders)" 
                  activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardBox>
    </div>
  );
};

export default DashboardOverview;
