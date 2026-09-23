"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe2,
  Loader2,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import ConnectDomainPanel from "./connect-domain-panel";
import MyDomainsPanel from "./my-domains-panel";
import { getDomainBundlePricing } from "@/lib/domainPricing";
import { purchaseDomain } from "@/lib/purchasedDomain";
import {
  formatAddonPrice,
  listPlanAddons,
  type PlanAddonId,
} from "@/lib/planAddons";
import type { PlanCycle } from "@/lib/razorpayPlans";
import {
  openRazorpayCheckout,
  waitForRazorpayScript,
} from "@/lib/razorpayCheckout";
import { buildRazorpayPrefill } from "@/lib/razorpayPrefill";
import { normalizeIndianPhone } from "@/lib/userProfileExtras";
import { getConnectionForSite, isSiteConnected } from "@/lib/customDomain";
import { getUserActiveSiteId } from "@/lib/migrateGuestSite";
import { saveCoreSubscription } from "@/lib/userPlan";
import { savePurchasedAddons } from "@/lib/userAddons";
import { formatInr } from "@/lib/razorpayPlans";
import type { DashboardTab } from "../sidebar";
import type { UserSite } from "../types";

type DomainsView = "search" | "mine" | "connect";

type SearchResult = {
  domain: string;
  available: boolean;
  premium?: boolean;
  price?: string | null;
  message?: string;
};

function BuyDomainModal({
  domain,
  sites,
  onClose,
  onSuccess,
}: {
  domain: string;
  sites: UserSite[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useUserAuth();
  const [cycle, setCycle] = useState<PlanCycle>("monthly");
  const [selectedAddonIds, setSelectedAddonIds] = useState<PlanAddonId[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const catalog = useMemo(() => listPlanAddons(), []);
  const pricing = useMemo(
    () => getDomainBundlePricing({ cycle, addonIds: selectedAddonIds }),
    [cycle, selectedAddonIds],
  );

  const publishedSites = useMemo(
    () => sites.filter((site) => site.published),
    [sites],
  );

  const selectableSites = useMemo(
    () => publishedSites.filter((site) => !isSiteConnected(site.id)),
    [publishedSites],
  );

  useEffect(() => {
    const preferred =
      selectableSites.find((site) => site.id === getUserActiveSiteId())?.id ||
      selectableSites[0]?.id ||
      "";
    setSelectedSiteId(preferred);
  }, [selectableSites]);

  const selectedSite = selectableSites.find((site) => site.id === selectedSiteId);

  const toggleAddon = (addonId: PlanAddonId) => {
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId],
    );
  };

  const handlePurchase = async () => {
    setError("");
    setSubmitting(true);

    try {
      if (!user) {
        throw new Error("Please log in to buy a domain.");
      }
      if (!selectedSite) {
        throw new Error("Please select a live website for this domain.");
      }

      const contact = normalizeIndianPhone(user.phone || "");
      const prefill = buildRazorpayPrefill(user);
      const sitePayload = {
        siteId: selectedSite.id,
        siteTitle: selectedSite.title,
        siteSlug: selectedSite.slug,
      };

      const orderResponse = await fetch("/api/user/domains/purchase", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          contact: contact || undefined,
          ...sitePayload,
          cycle,
          addonIds: selectedAddonIds,
        }),
      });

      const orderData = (await orderResponse.json().catch(() => ({}))) as {
        mock?: boolean;
        keyId?: string;
        orderId?: string;
        customerId?: string;
        amount?: number;
        currency?: string;
        displayPrice?: string;
        message?: string;
      };

      if (!orderResponse.ok || !orderData.orderId) {
        throw new Error(orderData.message || "Unable to start domain payment.");
      }

      let paymentId = `pay_mock_${Date.now()}`;
      let orderId = orderData.orderId;

      const activatePurchases = (nextPaymentId: string, nextOrderId: string) => {
        purchaseDomain({
          domain,
          price: pricing.resultPriceLabel,
          ...sitePayload,
        });
        saveCoreSubscription({
          cycle,
          paymentId: nextPaymentId,
          orderId: nextOrderId,
          ...sitePayload,
        });
        if (selectedAddonIds.length) {
          savePurchasedAddons(selectedAddonIds, {
            cycle,
            paymentId: nextPaymentId,
            orderId: nextOrderId,
            ...sitePayload,
          });
        }
      };

      if (orderData.mock) {
        const verifyResponse = await fetch(
          "/api/user/domains/purchase/verify",
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: paymentId,
              razorpay_order_id: orderId,
              razorpay_signature: "mock_signature",
              domain,
              ...sitePayload,
              cycle,
              addonIds: selectedAddonIds,
            }),
          },
        );
        const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
          message?: string;
          paymentId?: string;
          orderId?: string;
          price?: string;
        };
        if (!verifyResponse.ok) {
          throw new Error(verifyData.message || "Payment verification failed.");
        }
        paymentId = verifyData.paymentId || paymentId;
        orderId = verifyData.orderId || orderId;
        activatePurchases(paymentId, orderId);
        onSuccess();
        return;
      }

      if (!orderData.keyId) {
        throw new Error("Unable to start Razorpay checkout.");
      }

      await waitForRazorpayScript();

      const payment = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount ?? pricing.chargeAmount,
        currency: orderData.currency ?? "INR",
        customerId: orderData.customerId,
        rememberCustomer: Boolean(orderData.customerId),
        preferSavedCards: true,
        name: "CSS Founder",
        description: `${domain} + Core ${pricing.planPeriodLabel}${
          selectedAddonIds.length ? " + add-ons" : ""
        } (${orderData.displayPrice || pricing.checkoutLabel})`,
        prefill,
        notes: {
          purpose:
            cycle === "yearly"
              ? "domain_purchase_with_core_year"
              : "domain_purchase_with_core_month",
          domain,
          siteId: selectedSite.id,
          cycle,
          addonIds: selectedAddonIds.join(","),
        },
      });

      const verifyResponse = await fetch("/api/user/domains/purchase/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payment,
          domain,
          ...sitePayload,
          cycle,
          addonIds: selectedAddonIds,
        }),
      });

      const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
        message?: string;
        price?: string;
      };

      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || "Payment verification failed.");
      }

      activatePurchases(payment.razorpay_payment_id, payment.razorpay_order_id);
      onSuccess();
    } catch (purchaseError) {
      const message =
        purchaseError instanceof Error
          ? purchaseError.message
          : "Unable to purchase domain.";
      if (message !== "Payment cancelled.") {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-3 sm:p-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <button
        type="button"
        aria-label="Close purchase dialog"
        className="absolute inset-0 bg-zinc-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <section className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="relative shrink-0 border-b border-zinc-100 px-5 pb-3.5 pt-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-7 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <X size={14} />
          </button>

          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-blue-700">
            <Globe2 size={10} /> Buy domain + Core
          </span>
          <h3 className="mt-1.5 pr-8 text-lg font-bold tracking-tight text-zinc-950">
            {domain}
          </h3>
          <p className="mt-1 text-[11px] leading-4 text-zinc-500">
            1-year domain + Core. Choose billing cycle and optional add-ons.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-zinc-800">Core plan</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        id: "monthly" as const,
                        label: "Monthly",
                        hint: "₹900/mo",
                        badge: null,
                      },
                      {
                        id: "yearly" as const,
                        label: "Yearly",
                        hint: "₹8,400/yr",
                        badge: "−22%",
                      },
                    ] as const
                  ).map((option) => {
                    const active = cycle === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setCycle(option.id)}
                        className={`relative rounded-lg border px-2.5 py-2 text-left transition ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-blue-200"
                        }`}
                      >
                        {option.badge ? (
                          <span
                            className={`absolute right-1.5 top-1.5 rounded px-1 py-px text-[9px] font-semibold ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {option.badge}
                          </span>
                        ) : null}
                        <span className="block text-xs font-semibold">
                          {option.label}
                        </span>
                        <span
                          className={`mt-0.5 block text-[10px] ${
                            active ? "text-blue-100" : "text-zinc-500"
                          }`}
                        >
                          {option.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-zinc-800">
                  Add-ons{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                </p>
                <div className="mt-1.5 space-y-1.5">
                  {catalog.map((addon) => {
                    const checked = selectedAddonIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddon(addon.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition ${
                          checked
                            ? "border-blue-300 bg-blue-50"
                            : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }`}
                      >
                        <span
                          className={`grid size-4 shrink-0 place-items-center rounded border ${
                            checked
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-zinc-300 bg-white text-transparent"
                          }`}
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-zinc-900">
                              {addon.name}
                            </span>
                            <span className="shrink-0 text-[11px] font-semibold text-zinc-700">
                              {formatAddonPrice(addon, cycle)}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
                <p className="text-xs font-semibold text-zinc-800">
                  Order summary
                </p>
                <div className="mt-2 space-y-1.5 text-[11px] text-zinc-600">
                  <div className="flex items-center justify-between gap-2">
                    <span>Domain (1 year)</span>
                    <strong className="text-zinc-900">
                      {pricing.domainLabel}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Core ({pricing.planPeriodLabel})</span>
                    <strong className="text-zinc-900">
                      {pricing.planLabel}
                    </strong>
                  </div>
                  {selectedAddonIds.length > 0 ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>Add-ons ({selectedAddonIds.length})</span>
                      <strong className="text-zinc-900">
                        {formatInr(pricing.addonsInr)}
                      </strong>
                    </div>
                  ) : null}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-zinc-200 pt-2.5">
                  <span className="text-xs font-semibold text-zinc-800">
                    Total
                  </span>
                  <span className="text-sm font-bold text-zinc-950">
                    {pricing.totalLabel}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
                <label
                  htmlFor="buy-domain-website"
                  className="text-xs font-semibold text-zinc-800"
                >
                  Connect to website
                </label>
                <div className="relative mt-1.5">
                  <Globe2
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <select
                    id="buy-domain-website"
                    value={selectedSiteId}
                    onChange={(event) => setSelectedSiteId(event.target.value)}
                    className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-8 pr-8 text-xs font-medium text-zinc-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
                  >
                    <option value="">
                      {selectableSites.length
                        ? "Select a website"
                        : "No available websites"}
                    </option>
                    {publishedSites.map((site) => {
                      const connected = isSiteConnected(site.id);
                      return (
                        <option
                          key={site.id}
                          value={site.id}
                          disabled={connected}
                        >
                          {site.title} ({site.slug}) · Live
                          {connected
                            ? ` · Connected (${getConnectionForSite(site.id)?.domain})`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={12}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-100 px-5 py-3 sm:px-6">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || !selectedSiteId}
              onClick={() => void handlePurchase()}
              className="inline-flex h-9 min-w-[8.5rem] items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Paying...
                </>
              ) : (
                <>
                  Pay {pricing.totalLabel}
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DomainSearchPanel({
  sites,
  onPurchased,
  onNavigate,
}: {
  sites: UserSite[];
  onPurchased: () => void;
  onNavigate: (tab: DashboardTab) => void;
}) {
  const pricing = getDomainBundlePricing();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [configured, setConfigured] = useState(true);
  const [buyTarget, setBuyTarget] = useState<SearchResult | null>(null);

  const trimmed = useMemo(() => query.trim(), [query]);
  const availableCount = useMemo(
    () => results.filter((result) => result.available).length,
    [results],
  );

  const popularTlds = [".com", ".in", ".co.in", ".net", ".org", ".io", ".ai"];

  const applyTld = (tld: string) => {
    setQuery((current) => {
      const value = current.trim();
      if (!value) return `yourbrand${tld}`;
      const dotIndex = value.indexOf(".");
      const base = dotIndex > 0 ? value.slice(0, dotIndex) : value;
      return `${base}${tld}`;
    });
  };

  const runSearch = async () => {
    if (trimmed.length < 2) {
      setMessage("Enter at least 2 characters to search domains.");
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setMessage("");
    setHasSearched(true);
    try {
      const response = await fetch(
        `/api/user/domains/search?q=${encodeURIComponent(trimmed)}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        configured?: boolean;
        message?: string;
        results?: SearchResult[];
      };

      if (!response.ok) {
        throw new Error(data.message || "Unable to search domains.");
      }

      setConfigured(data.configured !== false);
      setMessage(data.message || "");
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      setResults([]);
      setConfigured(false);
      setMessage(
        error instanceof Error ? error.message : "Unable to search domains.",
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(24,39,75,.07)]">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 px-4 py-6 sm:px-6 sm:py-7">
          <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
            Find your perfect domain name
          </h3>
          <p className="mt-1.5 max-w-xl text-xs leading-5 text-blue-100 sm:text-sm">
            Search availability across popular extensions. Buy and connect to
            your live website in one checkout.
          </p>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder="Enter a name — e.g. brightschool, brand.co.in"
                className="h-11 w-full rounded-xl border-0 bg-white pl-10 pr-3 text-sm text-zinc-900 shadow-md outline-none ring-2 ring-white/20 placeholder:text-zinc-400 focus:ring-4 focus:ring-white/30"
              />
            </div>
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-400 disabled:opacity-70"
            >
              {searching ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  Search
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-blue-200">Popular:</span>
            {popularTlds.map((tld) => (
              <button
                key={tld}
                type="button"
                onClick={() => applyTld(tld)}
                className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                {tld}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-zinc-600">
            <span className="font-semibold text-zinc-900">
              {formatInr(pricing.domainInr)}/year
            </span>{" "}
            domain + Core (monthly or yearly) + optional add-ons at checkout
          </p>
          <p className="text-xs text-zinc-500">
            Auto-connects to your website after payment
          </p>
        </div>
      </section>

      {message ? (
        <div
          className={`mt-3 rounded-xl px-3 py-2.5 text-xs ${
            configured
              ? "border border-blue-100 bg-blue-50 text-blue-800"
              : "border border-amber-100 bg-amber-50 text-amber-800"
          }`}
        >
          {message}
        </div>
      ) : null}

      {hasSearched ? (
        <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-zinc-100 bg-zinc-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-950">
                Results for &ldquo;{trimmed}&rdquo;
              </h3>
              {!searching && results.length > 0 ? (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {availableCount} available · {results.length} extensions checked
                </p>
              ) : null}
            </div>
            {!searching && results.length > 0 ? (
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {availableCount} ready to buy
              </span>
            ) : null}
          </div>

          {searching ? (
            <div className="flex flex-col items-center gap-2.5 px-4 py-12">
              <Loader2 size={28} className="animate-spin text-blue-600" />
              <p className="text-sm font-medium text-zinc-600">
                Checking domain availability...
              </p>
            </div>
          ) : results.length ? (
            <ul className="divide-y divide-zinc-100">
              {results.map((result) => (
                <li
                  key={result.domain}
                  className={`flex flex-col gap-3 px-4 py-4 transition sm:flex-row sm:items-center sm:justify-between ${
                    result.available ? "bg-white hover:bg-blue-50/30" : "bg-zinc-50/50"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-lg ${
                        result.available
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-200 text-zinc-500"
                      }`}
                    >
                      <Globe2 size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-zinc-950 sm:text-base">
                          {result.domain}
                        </p>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            result.available
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-zinc-200 text-zinc-600"
                          }`}
                        >
                          {result.available ? "Available" : "Taken"}
                        </span>
                        {result.premium ? (
                          <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                            Premium
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {result.available
                          ? "Includes 1-year registration + Core (monthly or yearly) + optional add-ons"
                          : result.message ||
                            "This domain is already registered or unavailable."}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    {result.available ? (
                      <>
                        <div className="text-right">
                          <p className="text-lg font-bold text-zinc-950">
                            {formatInr(pricing.domainInr)}
                            <span className="text-xs font-medium text-zinc-500">
                              /yr
                            </span>
                          </p>
                          <p className="text-xs text-zinc-500">
                            + {formatInr(pricing.planInr)} Core (1 mo)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBuyTarget(result)}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          Buy now
                          <ArrowRight size={14} />
                        </button>
                      </>
                    ) : (
                      <p className="text-xs font-medium text-zinc-400 sm:text-right">
                        Not available
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <Globe2 size={28} className="mx-auto text-zinc-300" aria-hidden />
              <p className="mt-2.5 text-sm font-semibold text-zinc-700">
                No results found
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Try a different name or another extension from the popular list
                above.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Search extensions",
              desc: "We check .com, .in, .co.in, .net, .org, .io, .ai and more in one go.",
            },
            {
              icon: Zap,
              title: "Buy + connect",
              desc: "Domain, Core plan, and any selected add-ons activate together after checkout.",
            },
            {
              icon: ShieldCheck,
              title: "Manage anytime",
              desc: "Renewals, DNS, and auto-renew live under My domains.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <Icon size={17} />
              </span>
              <h4 className="mt-2.5 text-sm font-bold text-zinc-950">{title}</h4>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{desc}</p>
            </article>
          ))}
        </section>
      )}

      <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Secure Razorpay checkout
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Domain + Core billed together. Manage renewals in My domains.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("Billing")}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          Billing & invoices
          <ArrowRight size={13} />
        </button>
      </div>

      {buyTarget ? (
        <BuyDomainModal
          domain={buyTarget.domain}
          sites={sites}
          onClose={() => setBuyTarget(null)}
          onSuccess={() => {
            setBuyTarget(null);
            onPurchased();
          }}
        />
      ) : null}
    </>
  );
}

function viewFromParams(searchParams: URLSearchParams): DomainsView {
  const view = searchParams.get("view");
  if (view === "connect") return "connect";
  if (view === "mine" || view === "my") return "mine";
  return "search";
}

export default function DomainsTab({
  sites,
  loadingSites,
  onNavigate,
}: {
  sites: UserSite[];
  loadingSites: boolean;
  onNavigate: (tab: DashboardTab) => void;
}) {
  const searchParams = useSearchParams();
  const [view, setView] = useState<DomainsView>(() => viewFromParams(searchParams));
  const [domainsRefreshKey, setDomainsRefreshKey] = useState(0);

  useEffect(() => {
    setView(viewFromParams(searchParams));
  }, [searchParams]);

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:flex-none sm:px-4 ${
      active
        ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80"
        : "text-zinc-500 hover:text-zinc-800"
    }`;

  return (
    <section className="relative min-h-full overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
      <div className="pointer-events-none absolute -left-16 top-8 size-64 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 size-72 rounded-full bg-indigo-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1320px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-blue-700 shadow-sm">
              <Globe2 size={12} /> Custom domains
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
              Domains
            </h2>
            <p className="mt-1 max-w-lg text-xs leading-5 text-zinc-500 sm:text-sm">
              Buy a new domain, manage renewals & DNS, or connect a third party
              domain you already own.
            </p>
          </div>
        </div>

        <div className="mt-4 inline-flex w-full items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setView("search")}
            className={tabClass(view === "search")}
          >
            Buy domain
          </button>
          <button
            type="button"
            onClick={() => setView("mine")}
            className={tabClass(view === "mine")}
          >
            My domains
          </button>
          <button
            type="button"
            onClick={() => setView("connect")}
            className={tabClass(view === "connect")}
          >
            Connect Third Party Domain
          </button>
        </div>

        <div className="mt-4">
          {view === "connect" ? (
            <ConnectDomainPanel sites={sites} loadingSites={loadingSites} />
          ) : view === "mine" ? (
            <MyDomainsPanel
              key={domainsRefreshKey}
              onNavigate={onNavigate}
            />
          ) : (
            <DomainSearchPanel
              sites={sites}
              onNavigate={onNavigate}
              onPurchased={() => {
                setDomainsRefreshKey((value) => value + 1);
                setView("mine");
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
