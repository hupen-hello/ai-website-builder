"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import {
  CalendarDays,
  Check,
  CreditCard,
  Download,
  Globe2,
  Loader2,
  Mail,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import { getDomainBundlePricing } from "@/lib/domainPricing";
import { downloadInvoice } from "@/lib/downloadInvoice";
import {
  formatDomainExpiry,
  listPurchasedDomains,
  type PurchasedDomain,
} from "@/lib/purchasedDomain";
import { formatExportPrice } from "@/lib/exportPricing";
import {
  listPurchasedExports,
  type PurchasedExport,
} from "@/lib/userExports";
import {
  listCreateAiChatCreditPurchases,
  type CreateAiChatCreditPurchase,
} from "@/lib/create-ai-chat-credits";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { buildRazorpayPrefill } from "@/lib/razorpayPrefill";
import { normalizeIndianPhone } from "@/lib/userProfileExtras";
import {
  formatInr,
  formatPlanChargeInr,
  getRazorpayPlan,
  type PlanCycle,
} from "@/lib/razorpayPlans";
import {
  listSiteSubscriptions,
  type SiteSubscription,
  type UserPlanCycle,
} from "@/lib/userPlan";
import type { UserSite } from "../types";
import type { DashboardTab } from "../sidebar";

type PaymentMethod = {
  id: string;
  brand: string;
  mark: string;
  ending: string;
  role: "Default" | "Backup";
  expires: string;
  holder: string;
  source?: "razorpay";
};

const supportTopics = [
  "Plan & subscription",
  "Payment method issue",
  "Invoice request",
  "Refund request",
  "Other",
] as const;

type SupportTopic = (typeof supportTopics)[number];

type BillingInvoice = {
  id: string;
  date: string;
  amount: string;
  plan: string;
  website: string;
  status: string;
};

function formatBillingDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function subscriptionAmountLabel(cycle: UserPlanCycle = "monthly") {
  return `${formatPlanChargeInr(cycle)}${cycle === "yearly" ? " / year" : " / month"}`;
}

function domainBillingAmountLabel() {
  return getDomainBundlePricing().domainLabel;
}

function resolveDomainWebsite(
  domain: PurchasedDomain,
  sites: UserSite[],
) {
  return (
    domain.siteTitle?.trim() ||
    sites.find((site) => site.id === domain.siteId)?.title?.trim() ||
    "—"
  );
}

function resolveExportWebsite(
  item: PurchasedExport,
  sites: UserSite[],
) {
  return (
    item.siteTitle?.trim() ||
    sites.find((site) => site.id === item.siteId)?.title?.trim() ||
    item.siteSlug ||
    "Untitled website"
  );
}

function exportPlanLabel(item: PurchasedExport) {
  return item.format === "nextjs"
    ? "Website Export (Next.js)"
    : "Website Export (HTML)";
}

function exportAmountLabel(item: PurchasedExport) {
  if (item.amountInr > 0) return formatInr(item.amountInr);
  return formatExportPrice(item.format);
}

function chatCreditPlanLabel(item: CreateAiChatCreditPurchase) {
  return `Create AI chat · ${item.credits} credits`;
}

function chatCreditAmountLabel(item: CreateAiChatCreditPurchase) {
  return formatInr(item.amountInr);
}

function domainStatusLabel(status: PurchasedDomain["status"]) {
  if (status === "active") return { label: "Active", tone: "emerald" as const };
  if (status === "expiring") return { label: "Expiring", tone: "amber" as const };
  return { label: "Expired", tone: "red" as const };
}

function resolveSiteTitle(
  subscription: SiteSubscription,
  sites: UserSite[],
) {
  return (
    subscription.siteTitle?.trim() ||
    sites.find((site) => site.id === subscription.siteId)?.title?.trim() ||
    "Untitled website"
  );
}

function buildInvoicesFromSubscriptions(
  subscriptions: SiteSubscription[],
  sites: UserSite[],
): BillingInvoice[] {
  return [...subscriptions]
    .sort(
      (a, b) =>
        new Date(b.upgradedAt).getTime() - new Date(a.upgradedAt).getTime(),
    )
    .map((subscription) => {
      const cycle = subscription.cycle === "yearly" ? "yearly" : "monthly";
      const website = resolveSiteTitle(subscription, sites);
      return {
        id:
          subscription.orderId ||
          subscription.paymentId ||
          `INV-${subscription.siteId.slice(0, 8)}`,
        date: formatBillingDate(subscription.upgradedAt),
        amount: subscriptionAmountLabel(cycle),
        plan: `Core ${cycle === "yearly" ? "Yearly" : "Monthly"}`,
        website,
        status: "Paid",
      };
    });
}

function monthlyInrTotal(subscriptions: SiteSubscription[]) {
  return subscriptions.reduce((total, subscription) => {
    const cycle = subscription.cycle === "yearly" ? "yearly" : "monthly";
    const plan = getRazorpayPlan(cycle as PlanCycle);
    return total + plan.chargeDisplayInr;
  }, 0);
}

export default function BillingTab({
  onNavigate,
  sites = [],
}: {
  onNavigate: (tab: DashboardTab) => void;
  sites?: UserSite[];
}) {
  const { user } = useUserAuth();
  const [query, setQuery] = useState("");
  const [paidSubscriptions, setPaidSubscriptions] = useState<SiteSubscription[]>(
    [],
  );
  const [purchasedDomains, setPurchasedDomains] = useState<PurchasedDomain[]>(
    [],
  );
  const [purchasedExports, setPurchasedExports] = useState<PurchasedExport[]>(
    [],
  );
  const [chatCreditPurchases, setChatCreditPurchases] = useState<
    CreateAiChatCreditPurchase[]
  >([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [deletingCard, setDeletingCard] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [cardActionMessage, setCardActionMessage] = useState("");
  const [cardActionSuccess, setCardActionSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportTopic, setSupportTopic] = useState<SupportTopic>(
    supportTopics[0],
  );
  const [supportService, setSupportService] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportError, setSupportError] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [supportSending, setSupportSending] = useState(false);

  const supportServiceOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [
      {
        value: "General account billing",
        label: "General account billing",
      },
    ];

    for (const site of sites) {
      const title = site.title?.trim() || site.slug || "Website";
      options.push({
        value: `Website plan · ${title}`,
        label: `Website plan · ${title}`,
      });
    }

    for (const domain of purchasedDomains) {
      options.push({
        value: `Domain · ${domain.domain}`,
        label: `Domain · ${domain.domain}`,
      });
    }

    for (const item of purchasedExports) {
      const title = item.siteTitle || item.siteId || "Website";
      options.push({
        value: `Website export (${item.format}) · ${title}`,
        label: `Website export (${item.format.toUpperCase()}) · ${title}`,
      });
    }

    for (const item of chatCreditPurchases) {
      options.push({
        value: `Create AI chat credits · ${item.credits}`,
        label: `Create AI chat · ${item.credits} credits`,
      });
    }

    return options;
  }, [sites, purchasedDomains, purchasedExports, chatCreditPurchases]);

  const loadPaymentMethodsFromRazorpay = useCallback(async () => {
    if (!user?.id) {
      setPaymentMethods([]);
      return;
    }

    setLoadingMethods(true);
    try {
      const res = await fetch("/api/user/payments/razorpay/tokens", {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        methods?: PaymentMethod[];
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message || "Unable to load saved cards.");
      }

      setPaymentMethods(Array.isArray(data.methods) ? data.methods : []);
    } catch (error) {
      setCardActionSuccess(false);
      setCardActionMessage(
        error instanceof Error
          ? error.message
          : "Unable to load saved cards.",
      );
    } finally {
      setLoadingMethods(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadPaymentMethodsFromRazorpay();
  }, [loadPaymentMethodsFromRazorpay]);

  useEffect(() => {
    if (!cardActionSuccess || !cardActionMessage) return;
    const timer = window.setTimeout(() => {
      setCardActionMessage("");
      setCardActionSuccess(false);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [cardActionMessage, cardActionSuccess]);

  useEffect(() => {
    const ownedIds = new Set(sites.map((site) => site.id));
    const creditUserKey = user?.id || user?.email || "guest";

    const refreshBillingData = () => {
      setPaidSubscriptions(listSiteSubscriptions());
      setPurchasedDomains(
        listPurchasedDomains().filter(
          (domain) => !domain.siteId || ownedIds.has(domain.siteId),
        ),
      );
      setPurchasedExports(
        listPurchasedExports().filter((item) => ownedIds.has(item.siteId)),
      );
      setChatCreditPurchases(listCreateAiChatCreditPurchases(creditUserKey));
    };

    refreshBillingData();
    window.addEventListener("focus", refreshBillingData);
    window.addEventListener("storage", refreshBillingData);
    window.addEventListener("css-ai-plan-updated", refreshBillingData);
    return () => {
      window.removeEventListener("focus", refreshBillingData);
      window.removeEventListener("storage", refreshBillingData);
      window.removeEventListener("css-ai-plan-updated", refreshBillingData);
    };
  }, [sites, user?.id, user?.email]);

  const invoices = useMemo(
    () => buildInvoicesFromSubscriptions(paidSubscriptions, sites),
    [paidSubscriptions, sites],
  );

  const domainInvoices = useMemo(() => {
    return [...purchasedDomains]
      .sort(
        (a, b) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
      )
      .map((domain) => ({
        id: `DOM-${domain.id.slice(0, 12)}`,
        date: formatBillingDate(domain.purchasedAt),
        amount: domainBillingAmountLabel(),
        plan: "Domain (1 year)",
        website: resolveDomainWebsite(domain, sites),
        domain: domain.domain,
        status: "Paid",
      }));
  }, [purchasedDomains, sites]);

  const exportInvoices = useMemo(() => {
    return [...purchasedExports]
      .sort(
        (a, b) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
      )
      .map((item) => {
        const shortId = (item.orderId || item.paymentId || item.siteId).slice(
          0,
          12,
        );
        return {
          id: `EXP-${shortId}`,
          date: formatBillingDate(item.purchasedAt),
          amount: exportAmountLabel(item),
          plan: exportPlanLabel(item),
          website: resolveExportWebsite(item, sites),
          status: "Paid",
          purchasedAt: item.purchasedAt,
        };
      });
  }, [purchasedExports, sites]);

  const chatCreditInvoices = useMemo(() => {
    return [...chatCreditPurchases]
      .sort(
        (a, b) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
      )
      .map((item) => {
        const shortId = (item.orderId || item.paymentId || item.id).slice(0, 12);
        return {
          id: item.id.startsWith("CAI-") ? item.id : `CAI-${shortId}`,
          date: formatBillingDate(item.purchasedAt),
          amount: chatCreditAmountLabel(item),
          plan: chatCreditPlanLabel(item),
          website: "Create with AI · Chat",
          status: "Paid",
          purchasedAt: item.purchasedAt,
        };
      });
  }, [chatCreditPurchases]);

  const billingSummary = useMemo(() => {
    const count = paidSubscriptions.length;
    const domainCount = purchasedDomains.length;
    if (count === 0 && domainCount === 0) {
      return {
        planLabel: "No paid websites",
        totalLabel: "₹0",
        cycleLabel: "—",
        nextBillingLabel: "—",
        paidWebsitesLabel: "0 websites",
        domainsLabel: "0 domains",
        isActive: false,
      };
    }

    const monthlyTotal = monthlyInrTotal(paidSubscriptions);
    const cycles = new Set(
      paidSubscriptions.map((item) =>
        item.cycle === "yearly" ? "Yearly" : "Monthly",
      ),
    );
    const nextBilling = paidSubscriptions
      .map((item) => item.expiresAt)
      .filter((value): value is string => Boolean(value))
      .sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      )[0];

    return {
      planLabel:
        count > 0
          ? `Core on ${count} website${count === 1 ? "" : "s"}`
          : "No Core plans",
      totalLabel: `₹${monthlyTotal.toLocaleString("en-IN")}`,
      cycleLabel:
        count === 0
          ? "—"
          : cycles.size === 1
            ? [...cycles][0]
            : "Mixed monthly & yearly",
      nextBillingLabel: formatBillingDate(nextBilling),
      paidWebsitesLabel: `${count} website${count === 1 ? "" : "s"}`,
      domainsLabel: `${domainCount} domain${domainCount === 1 ? "" : "s"}`,
      isActive: count > 0 || domainCount > 0,
    };
  }, [paidSubscriptions, purchasedDomains]);

  const filteredInvoices = useMemo(() => {
    const allInvoices: BillingInvoice[] = [
      ...invoices,
      ...domainInvoices.map((item) => ({
        id: item.id,
        date: item.date,
        amount: item.amount,
        plan: item.plan,
        website: item.domain,
        status: item.status,
      })),
      ...exportInvoices.map((item) => ({
        id: item.id,
        date: item.date,
        amount: item.amount,
        plan: item.plan,
        website: item.website,
        status: item.status,
      })),
      ...chatCreditInvoices.map((item) => ({
        id: item.id,
        date: item.date,
        amount: item.amount,
        plan: item.plan,
        website: item.website,
        status: item.status,
      })),
    ].sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return bTime - aTime;
    });

    const value = query.trim().toLowerCase();
    if (!value) return allInvoices;

    return allInvoices.filter((invoice) =>
      `${invoice.id} ${invoice.date} ${invoice.amount} ${invoice.plan} ${invoice.website} ${invoice.status}`
        .toLowerCase()
        .includes(value),
    );
  }, [chatCreditInvoices, domainInvoices, exportInvoices, invoices, query]);

  const toggleMethod = (id: string) => {
    setSelectedMethodId((current) => (current === id ? null : id));
  };

  const handleAddCardViaRazorpay = async () => {
    if (!user || savingCard) return;

    setSavingCard(true);
    setCardActionMessage("");
    setCardActionSuccess(false);

    try {
      if (!scriptReady) {
        throw new Error("Razorpay checkout is still loading. Please try again.");
      }

      const contact = normalizeIndianPhone(user.phone || "");

      const orderRes = await fetch("/api/user/payments/razorpay/save-card", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact || undefined }),
      });
      const orderData = (await orderRes.json().catch(() => ({}))) as {
        mock?: boolean;
        keyId?: string;
        orderId?: string;
        customerId?: string;
        amount?: number;
        currency?: string;
        message?: string;
      };

      if (!orderRes.ok || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.message || "Unable to start card save.");
      }

      const payment = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount ?? 100,
        currency: orderData.currency ?? "INR",
        customerId: orderData.customerId,
        rememberCustomer: true,
        method: "card",
        preferSavedCards: true,
        name: "CSS Founder",
        description: "Save card for future payments (₹1 verification)",
        prefill: buildRazorpayPrefill(user),
        notes: { purpose: "save_card" },
      });

      const verifyRes = await fetch(
        "/api/user/payments/razorpay/save-card/verify",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payment),
        },
      );
      const verifyData = (await verifyRes.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!verifyRes.ok) {
        throw new Error(verifyData.message || "Card verification failed.");
      }

      await loadPaymentMethodsFromRazorpay();
      setCardActionSuccess(true);
      setCardActionMessage(
        verifyData.message ||
          "Card saved successfully. It will appear at checkout.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save card.";
      if (message !== "Payment cancelled.") {
        setCardActionSuccess(false);
        setCardActionMessage(message);
      }
    } finally {
      setSavingCard(false);
    }
  };

  const deleteSelectedMethod = async () => {
    if (!selectedMethodId || deletingCard) return;

    setDeletingCard(true);
    setCardActionMessage("");
    setCardActionSuccess(false);

    try {
      const res = await fetch(
        `/api/user/payments/razorpay/tokens/${encodeURIComponent(selectedMethodId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = (await res.json().catch(() => ({}))) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message || "Unable to delete card.");
      }

      setSelectedMethodId(null);
      setShowDeleteConfirm(false);
      await loadPaymentMethodsFromRazorpay();
      setCardActionSuccess(true);
      setCardActionMessage(data.message || "Card removed successfully.");
    } catch (error) {
      setCardActionSuccess(false);
      setCardActionMessage(
        error instanceof Error ? error.message : "Unable to delete card.",
      );
    } finally {
      setDeletingCard(false);
    }
  };

  const openSupportModal = () => {
    setSupportTopic(supportTopics[0]);
    setSupportService(supportServiceOptions[0]?.value || "General account billing");
    setSupportMessage("");
    setSupportError("");
    setSupportSent(false);
    setSupportSending(false);
    setShowSupportModal(true);
  };

  const closeSupportModal = () => {
    if (supportSending) return;
    setShowSupportModal(false);
    setSupportError("");
    setSupportSent(false);
    setSupportSending(false);
  };

  const submitSupport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supportService.trim()) {
      setSupportError("Please select which service this request is for.");
      return;
    }
    if (!supportMessage.trim()) {
      setSupportError("Please describe your billing issue.");
      return;
    }
    if (supportSending) return;

    setSupportSending(true);
    setSupportError("");
    try {
      const response = await fetch("/api/user/support/billing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "billing",
          topic: supportTopic,
          service: supportService.trim(),
          message: supportMessage.trim(),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message || "Unable to send support message.");
      }
      setSupportSent(true);
    } catch (error) {
      setSupportError(
        error instanceof Error
          ? error.message
          : "Unable to send support message.",
      );
    } finally {
      setSupportSending(false);
    }
  };

  return (
    <section className="relative min-h-full overflow-hidden px-4 py-7 sm:px-6 sm:py-9 lg:px-9">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-72 size-72 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1400px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-[-.04em] text-zinc-950">
                Billing
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ${
                  billingSummary.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    billingSummary.isActive ? "bg-emerald-500" : "bg-zinc-400"
                  }`}
                />{" "}
                {billingSummary.isActive ? "Active" : "No payments"}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-5 text-zinc-500">
              Core plan billing and purchased domains are listed separately
              below.
            </p>
          </div>
          <button
            type="button"
            onClick={openSupportModal}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <ReceiptText size={15} /> Billing support
          </button>
        </div>

        <article className="relative mt-7 overflow-hidden rounded-[26px] border border-blue-100 bg-[linear-gradient(120deg,#eef5ff_0%,#ffffff_50%,#effcf8_100%)] p-5 shadow-[0_20px_55px_rgba(50,86,145,.11)] sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-[1.1fr_.75fr_.75fr_.9fr_.75fr_.75fr_auto] lg:items-center">
            <PlanMetric label="Your plan" value={billingSummary.planLabel} />
            <PlanMetric label="Plan total" value={billingSummary.totalLabel} />
            <PlanMetric label="Cycle" value={billingSummary.cycleLabel} />
            <PlanMetric
              label="Next billing date"
              value={billingSummary.nextBillingLabel}
            />
            <div>
              <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-400">
                <Users size={12} /> Paid websites
              </span>
              <strong className="mt-1.5 block text-sm font-semibold text-zinc-900">
                {billingSummary.paidWebsitesLabel}
              </strong>
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-400">
                <Globe2 size={12} /> Domains
              </span>
              <strong className="mt-1.5 block text-sm font-semibold text-zinc-900">
                {billingSummary.domainsLabel}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("Plan")}
              className="h-10 rounded-xl bg-zinc-950 px-5 text-xs font-semibold text-white shadow-lg shadow-zinc-300/70 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Manage plans
            </button>
          </div>
        </article>

        <div className="mt-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-zinc-950">
                Paid websites
              </h3>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                Each row is a website that has an active Core payment.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_35px_rgba(36,52,80,.06)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="border-b border-zinc-100 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Website</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Paid on</th>
                    <th className="px-5 py-3">Next billing</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paidSubscriptions.map((subscription) => {
                    const cycle =
                      subscription.cycle === "yearly" ? "yearly" : "monthly";
                    const website = resolveSiteTitle(subscription, sites);

                    return (
                      <tr
                        key={subscription.siteId}
                        className="text-[11px] text-zinc-600 transition hover:bg-blue-50/35"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-800">
                          {website}
                        </td>
                        <td className="px-5 py-4">
                          Core {cycle === "yearly" ? "Yearly" : "Monthly"}
                        </td>
                        <td className="px-5 py-4 font-medium text-zinc-800">
                          {subscriptionAmountLabel(cycle)}
                        </td>
                        <td className="px-5 py-4">
                          {formatBillingDate(subscription.upgradedAt)}
                        </td>
                        <td className="px-5 py-4">
                          {formatBillingDate(subscription.expiresAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {paidSubscriptions.length === 0 ? (
              <div className="grid place-items-center px-6 py-12 text-center">
                <Search size={20} className="text-zinc-300" />
                <p className="mt-3 text-xs font-medium text-zinc-700">
                  No paid websites yet
                </p>
                <p className="mt-1 text-[10px] text-zinc-400">
                  Upgrade a website from Plan or My Websites to see billing
                  here.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("Plan")}
                  className="mt-4 inline-flex h-9 items-center rounded-xl bg-blue-700 px-4 text-[11px] font-semibold text-white transition hover:bg-blue-800"
                >
                  Go to Plan
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-zinc-950">
                Purchased domains
              </h3>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                Domain registration fees only (₹1,200/year). Core plan stays in
                Paid websites above.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("Domains")}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-[11px] font-medium text-zinc-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              <Globe2 size={14} /> Manage domains
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_35px_rgba(36,52,80,.06)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="border-b border-zinc-100 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Domain</th>
                    <th className="px-5 py-3">Website</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Purchased on</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {purchasedDomains.map((domain) => {
                    const status = domainStatusLabel(domain.status);
                    return (
                      <tr
                        key={domain.id}
                        className="text-[11px] text-zinc-600 transition hover:bg-blue-50/35"
                      >
                        <td className="px-5 py-4 font-medium text-zinc-800">
                          {domain.domain}
                        </td>
                        <td className="px-5 py-4">
                          {resolveDomainWebsite(domain, sites)}
                        </td>
                        <td className="px-5 py-4 font-medium text-zinc-800">
                          {domainBillingAmountLabel()}
                        </td>
                        <td className="px-5 py-4">
                          {formatBillingDate(domain.purchasedAt)}
                        </td>
                        <td className="px-5 py-4">
                          {formatDomainExpiry(domain.expiresAt)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold ${
                              status.tone === "emerald"
                                ? "bg-emerald-50 text-emerald-700"
                                : status.tone === "amber"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-600"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                status.tone === "emerald"
                                  ? "bg-emerald-500"
                                  : status.tone === "amber"
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                            />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {purchasedDomains.length === 0 ? (
              <div className="grid place-items-center px-6 py-12 text-center">
                <Globe2 size={20} className="text-zinc-300" />
                <p className="mt-3 text-xs font-medium text-zinc-700">
                  No domains purchased yet
                </p>
                <p className="mt-1 text-[10px] text-zinc-400">
                  Buy a domain from Domains to see registration billing here.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("Domains")}
                  className="mt-4 inline-flex h-9 items-center rounded-xl bg-blue-700 px-4 text-[11px] font-semibold text-white transition hover:bg-blue-800"
                >
                  Go to Domains
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-950">
              Payment methods
            </h3>
            <p className="mt-1.5 text-[13px] text-zinc-500">
              Cards saved via Razorpay appear here and at checkout for plan
              payments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedMethodId && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deletingCard}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 text-[11px] font-medium text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingCard ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}{" "}
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleAddCardViaRazorpay()}
              disabled={savingCard || !scriptReady}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-700 px-3.5 text-[11px] font-medium text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCard ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}{" "}
              Add new card
            </button>
          </div>
        </div>

        {cardActionMessage ? (
          <div
            role="status"
            className={`mt-4 rounded-xl border px-4 py-3 text-[12px] ${
              cardActionSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {cardActionMessage}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_35px_rgba(36,52,80,.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="border-b border-zinc-100 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="w-12 px-4 py-3" />
                  <th className="px-4 py-3">Payment method</th>
                  <th className="px-4 py-3">Ending</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Date expired</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loadingMethods ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-[12px] text-zinc-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Loading saved cards…
                      </span>
                    </td>
                  </tr>
                ) : (
                  paymentMethods.map((method) => {
                  const selected = selectedMethodId === method.id;

                  return (
                    <tr
                      key={method.id}
                      className="bg-white text-[13px] text-zinc-600 transition hover:bg-blue-50/35"
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleMethod(method.id)}
                          aria-label={`Select ${method.brand}`}
                          className={`grid size-4 place-items-center rounded border ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-200 bg-white"}`}
                        >
                          {selected && <Check size={10} strokeWidth={3} />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 min-w-12 place-items-center rounded-lg border border-zinc-100 bg-white px-2 text-[9px] font-semibold text-zinc-700 shadow-sm">
                            {method.mark}
                          </span>
                          <strong className="font-medium text-zinc-800">
                            {method.brand}
                          </strong>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">Ending {method.ending}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-semibold ${method.role === "Default" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}
                        >
                          {method.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{method.expires}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Saved
                        </span>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loadingMethods && paymentMethods.length === 0 && (
            <div className="grid place-items-center px-6 py-12 text-center">
              <Search size={20} className="text-zinc-300" />
              <p className="mt-3 text-xs font-medium text-zinc-700">
                No card is added
              </p>
              <p className="mt-1 text-[10px] text-zinc-400">
                Add a card via Razorpay to use it for Core plan payments.
              </p>
            </div>
          )}
        </div>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-950">
              Invoices
            </h3>
            <p className="mt-1.5 text-[13px] text-zinc-500">
              Receipts for Core upgrades and domain registrations.
            </p>
          </div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-zinc-400 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50 sm:w-64">
            <Search size={14} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search invoices"
              className="min-w-0 flex-1 bg-transparent text-xs text-zinc-800 outline-none placeholder:text-zinc-400"
            />
          </label>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_35px_rgba(36,52,80,.06)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="border-b border-zinc-100 bg-zinc-50/75 text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Invoice ID</th>
                  <th className="px-5 py-3">Date sent</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Website</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="w-14 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="text-[11px] text-zinc-600 transition hover:bg-blue-50/35"
                  >
                    <td className="px-5 py-4 font-medium text-zinc-800">
                      {invoice.id}
                    </td>
                    <td className="px-5 py-4">{invoice.date}</td>
                    <td className="px-5 py-4 font-medium text-zinc-800">
                      {invoice.amount}
                    </td>
                    <td className="px-5 py-4">{invoice.website}</td>
                    <td className="px-5 py-4">{invoice.plan}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold ${invoice.status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${invoice.status === "Paid" ? "bg-emerald-500" : "bg-red-500"}`}
                        />
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        aria-label={`Download ${invoice.id}`}
                        title="Download invoice"
                        onClick={() =>
                          downloadInvoice({
                            ...invoice,
                            customerName: user?.name,
                            customerEmail: user?.email,
                          })
                        }
                        className="grid size-8 place-items-center rounded-lg border border-zinc-100 text-zinc-400 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="grid place-items-center px-6 py-12 text-center">
              <Search size={20} className="text-zinc-300" />
              <p className="mt-3 text-xs font-medium text-zinc-700">
                {query ? "No matching invoices" : "No invoices yet"}
              </p>
              <p className="mt-1 text-[10px] text-zinc-400">
                {query
                  ? "Try another invoice number, plan, or status."
                  : "No invoices yet. Paid Core upgrades, domains, website exports, and Create AI chat credits appear here."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/55 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="text-xs font-medium text-zinc-800">
                Payments are securely encrypted
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">
                Card information is handled through Razorpay secure checkout.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-[10px] font-medium text-blue-700">
            <WalletCards size={14} /> {paymentMethods.length} payment methods
            connected
          </span>
        </div>
      </div>

      {showSupportModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close billing support"
            onClick={closeSupportModal}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-support-title"
            className="relative z-10 w-full max-w-md rounded-[26px] border border-white/80 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,.25)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="grid size-10 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                  <ReceiptText size={18} />
                </span>
                <h3
                  id="billing-support-title"
                  className="mt-4 text-xl font-semibold tracking-tight text-zinc-950"
                >
                  Billing support
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                  Get help with plans, payments, invoices, or refunds. We usually
                  reply within 1 business day.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSupportModal}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            {supportSent ? (
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-center">
                <p className="text-sm font-medium text-emerald-800">
                  Message sent to our team
                </p>
                <p className="mt-2 text-[11px] leading-5 text-emerald-700">
                  Your billing support request is now visible on the admin
                  dashboard. We usually reply within 1 business day.
                </p>
                <button
                  type="button"
                  onClick={closeSupportModal}
                  className="mt-5 h-10 w-full rounded-xl bg-zinc-950 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => void submitSupport(event)}
                className="mt-6 grid gap-4"
              >
                <label className="grid gap-1.5 text-[11px] font-medium text-zinc-700">
                  Which service is this request for?
                  <select
                    value={supportService}
                    onChange={(event) => setSupportService(event.target.value)}
                    disabled={supportSending}
                    required
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                  >
                    {supportServiceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-[11px] font-medium text-zinc-700">
                  Topic
                  <select
                    value={supportTopic}
                    onChange={(event) =>
                      setSupportTopic(event.target.value as SupportTopic)
                    }
                    disabled={supportSending}
                    className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                  >
                    {supportTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-[11px] font-medium text-zinc-700">
                  Message
                  <textarea
                    value={supportMessage}
                    onChange={(event) => setSupportMessage(event.target.value)}
                    rows={5}
                    disabled={supportSending}
                    placeholder="Describe your billing question or issue..."
                    className="resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                  />
                </label>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3 text-[10px] leading-5 text-zinc-500">
                  Your account details ({user?.name || "—"},{" "}
                  {user?.email || "—"}) will be included automatically.
                </div>

                {supportError && (
                  <p role="alert" className="text-[11px] text-red-600">
                    {supportError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeSupportModal();
                      onNavigate("Plan");
                    }}
                    disabled={supportSending}
                    className="h-11 flex-1 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60"
                  >
                    View plans
                  </button>
                  <button
                    type="submit"
                    disabled={supportSending}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(120deg,#315ff4,#6b4ff8)] text-xs font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                  >
                    {supportSending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={14} /> Send message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedMethodId && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close delete confirmation"
            onClick={() => setShowDeleteConfirm(false)}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-payment-title"
            aria-describedby="delete-payment-description"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,.3)]"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-red-100/70 blur-3xl" />
            <div className="relative">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/60">
                <Trash2 size={24} strokeWidth={2.2} />
              </span>
              <h3
                id="delete-payment-title"
                className="mt-6 text-xl font-semibold tracking-tight text-zinc-950"
              >
                Delete payment method?
              </h3>
              <p
                id="delete-payment-description"
                className="mx-auto mt-2 max-w-xs text-[12px] leading-5 text-zinc-500"
              >
                This card will be permanently removed from your account. This
                action cannot be undone.
              </p>

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-11 flex-1 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void deleteSelectedMethod()}
                  disabled={deletingCard}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(120deg,#ef4444,#dc2626)] text-xs font-semibold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingCard ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}{" "}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-zinc-400">
        {label === "Cycle" && <CalendarDays size={12} />}
        {label === "Total amount" && <CreditCard size={12} />}
        {label}
      </span>
      <strong className="mt-1.5 block text-sm font-semibold text-zinc-900">
        {value}
      </strong>
    </div>
  );
}
