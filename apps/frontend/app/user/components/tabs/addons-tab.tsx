"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Globe2,
  Headphones,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import { redirectToAuth } from "@/lib/authReturn";
import { getUserActiveSiteId } from "@/lib/migrateGuestSite";
import {
  formatAddonBundleLabel,
  formatAddonPrice,
  getAddonPrice,
  getPlanAddon,
  listPlanAddons,
  sumAddonChargeAmount,
  sumAddonDisplayAmount,
  type PlanAddon,
  type PlanAddonId,
} from "@/lib/planAddons";
import { formatInr } from "@/lib/razorpayPlans";
import { openRazorpayCheckout, waitForRazorpayScript } from "@/lib/razorpayCheckout";
import { buildRazorpayPrefill } from "@/lib/razorpayPrefill";
import { normalizeIndianPhone } from "@/lib/userProfileExtras";
import {
  cancelPurchasedAddon,
  getPurchasedAddon,
  hasActiveAddon,
  listPurchasedAddons,
  savePurchasedAddons,
  type PurchasedAddon,
} from "@/lib/userAddons";
import {
  getCorePlanCycle,
  getSiteSubscription,
  isCorePlanActive,
} from "@/lib/userPlan";
import type { DashboardTab } from "../sidebar";
import type { UserSite } from "../types";

type BuyMode = "single" | "multiple";

type AddonsTabProps = {
  sites: UserSite[];
  loadingSites?: boolean;
  onNavigate: (tab: DashboardTab) => void;
};

function addonIcon(id: PlanAddonId) {
  if (id === "google-my-business") return MapPin;
  if (id === "priority-support") return Headphones;
  return ShieldCheck;
}

function formatAddonDate(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AddonsTab({
  sites,
  loadingSites = false,
  onNavigate,
}: AddonsTabProps) {
  const { user, loading: authLoading } = useUserAuth();
  const searchParams = useSearchParams();
  const [tick, setTick] = useState(0);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [buyMode, setBuyMode] = useState<BuyMode>("single");
  const [selectedAddonIds, setSelectedAddonIds] = useState<PlanAddonId[]>([]);
  const [buyingId, setBuyingId] = useState<PlanAddonId | null>(null);
  const [buyingBundle, setBuyingBundle] = useState(false);
  const [cancellingId, setCancellingId] = useState<PlanAddonId | null>(null);
  const [cancelConfirmAddonId, setCancelConfirmAddonId] =
    useState<PlanAddonId | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const publishedSites = useMemo(
    () => sites.filter((site) => site.published),
    [sites],
  );

  const coreSites = useMemo(() => {
    if (!storageReady) return [];
    void tick;
    return publishedSites.filter((site) => isCorePlanActive(site.id));
  }, [publishedSites, tick, storageReady]);

  const selectedSite = useMemo(
    () => coreSites.find((site) => site.id === selectedSiteId) || null,
    [coreSites, selectedSiteId],
  );

  const selectedSiteName =
    selectedSite?.title?.trim() || "Untitled website";

  const siteSubscription = useMemo(() => {
    if (!storageReady || !selectedSiteId) return null;
    void tick;
    return getSiteSubscription(selectedSiteId);
  }, [selectedSiteId, tick, storageReady]);

  const activeCycle = useMemo(() => {
    if (!selectedSiteId || !storageReady) return null;
    void tick;
    return getCorePlanCycle(selectedSiteId);
  }, [selectedSiteId, tick, storageReady]);

  const purchased = useMemo(() => {
    if (!storageReady || !selectedSiteId) return [];
    void tick;
    return listPurchasedAddons(selectedSiteId);
  }, [selectedSiteId, tick, storageReady]);

  const catalog = useMemo(() => listPlanAddons(), []);

  const bundleTotalInr = useMemo(
    () => sumAddonDisplayAmount(selectedAddonIds, activeCycle || "monthly"),
    [selectedAddonIds, activeCycle],
  );

  const isPaying = Boolean(buyingId) || buyingBundle;

  useEffect(() => {
    setStorageReady(true);
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (!storageReady || loadingSites) return;

    const pickIfCore = (id: string | null | undefined) =>
      id && coreSites.some((site) => site.id === id) ? id : null;

    const preferred =
      pickIfCore(searchParams.get("siteId")) ||
      pickIfCore(getUserActiveSiteId()) ||
      coreSites[0]?.id ||
      "";

    setSelectedSiteId((current) => {
      if (current && coreSites.some((site) => site.id === current)) {
        return current;
      }
      return preferred;
    });
  }, [coreSites, loadingSites, searchParams, storageReady]);

  useEffect(() => {
    setMessage("");
    setError("");
    setCancelConfirmAddonId(null);
    setSelectedAddonIds([]);
  }, [selectedSiteId]);

  useEffect(() => {
    setSelectedAddonIds([]);
  }, [buyMode]);

  const toggleSelectedAddon = (addonId: PlanAddonId) => {
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId],
    );
  };

  const processAddonCheckout = async (addonIds: PlanAddonId[]) => {
    if (addonIds.length === 0) return;

    setError("");
    setMessage("");

    if (authLoading) return;
    if (!user) {
      redirectToAuth({ returnUrl: "/user/addons" });
      return;
    }
    if (!selectedSite) {
      setError("Select a website with an active Core plan first.");
      return;
    }
    if (!activeCycle) {
      setError("This website needs an active Core plan before buying add-ons.");
      return;
    }

    for (const addonId of addonIds) {
      if (hasActiveAddon(selectedSite.id, addonId)) {
        const addon = getPlanAddon(addonId);
        throw new Error(`${addon?.name || "Add-on"} is already active on "${selectedSiteName}".`);
      }
    }

    const sitePayload = {
      siteId: selectedSite.id,
      siteTitle: selectedSiteName,
      siteSlug: selectedSite.slug,
    };

    const contact = normalizeIndianPhone(user.phone || "");
    const isBundle = addonIds.length > 1;
    const bundleLabel = formatAddonBundleLabel(addonIds, activeCycle);
    const checkoutDisplayTotal = sumAddonDisplayAmount(addonIds, activeCycle);

    const orderResponse = await fetch("/api/user/payments/razorpay/addon-order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(isBundle ? { addonIds } : { addonId: addonIds[0] }),
        cycle: activeCycle,
        contact: contact || undefined,
        ...sitePayload,
      }),
    });

    const orderData = (await orderResponse.json().catch(() => ({}))) as {
      mock?: boolean;
      keyId?: string;
      customerId?: string;
      orderId?: string;
      amount?: number;
      currency?: string;
      displayPrice?: string;
      addonName?: string;
      message?: string;
    };

    if (!orderResponse.ok || !orderData.orderId || !orderData.keyId) {
      throw new Error(orderData.message || "Unable to start add-on payment.");
    }

    const checkoutDescription = isBundle
      ? `${bundleLabel} · ${selectedSiteName} · ${orderData.displayPrice || formatInr(checkoutDisplayTotal)}`
      : `${orderData.addonName || getPlanAddon(addonIds[0]!)?.name} · ${selectedSiteName} · ${orderData.displayPrice || formatAddonPrice(getPlanAddon(addonIds[0]!)!, activeCycle)}`;

    if (orderData.mock) {
      const paymentId = `pay_mock_${Date.now()}`;
      savePurchasedAddons(addonIds, {
        ...sitePayload,
        cycle: activeCycle,
        paymentId,
        orderId: orderData.orderId,
      });
      setTick((value) => value + 1);
      setSelectedAddonIds([]);
      setMessage(
        isBundle
          ? `${addonIds.length} add-ons activated for "${selectedSiteName}".`
          : `${getPlanAddon(addonIds[0]!)?.name} activated for "${selectedSiteName}".`,
      );
      return;
    }

    await waitForRazorpayScript();

    const payment = await openRazorpayCheckout({
      keyId: orderData.keyId,
      orderId: orderData.orderId,
      amount: orderData.amount ?? sumAddonChargeAmount(addonIds, activeCycle),
      currency: orderData.currency ?? "INR",
      customerId: orderData.customerId,
      rememberCustomer: Boolean(orderData.customerId),
      preferSavedCards: true,
      name: "CSS Founder",
      description: checkoutDescription,
      prefill: buildRazorpayPrefill(user),
      notes: {
        purpose: "plan_addon",
        addonIds: addonIds.join(","),
        cycle: activeCycle,
        siteId: selectedSite.id,
      },
    });

    const verifyResponse = await fetch(
      "/api/user/payments/razorpay/addon-verify",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payment,
          ...(isBundle ? { addonIds } : { addonId: addonIds[0] }),
          cycle: activeCycle,
          ...sitePayload,
        }),
      },
    );
    const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
      message?: string;
      addonIds?: PlanAddonId[];
    };

    if (!verifyResponse.ok) {
      throw new Error(verifyData.message || "Add-on verification failed.");
    }

    const verifiedIds = verifyData.addonIds?.length
      ? verifyData.addonIds
      : addonIds;

    savePurchasedAddons(verifiedIds, {
      ...sitePayload,
      cycle: activeCycle,
      paymentId: payment.razorpay_payment_id,
      orderId: payment.razorpay_order_id,
    });
    setTick((value) => value + 1);
    setSelectedAddonIds([]);
    setMessage(
      verifyData.message ||
        (isBundle
          ? `${verifiedIds.length} add-ons activated for "${selectedSiteName}".`
          : `${getPlanAddon(verifiedIds[0]!)?.name} activated for "${selectedSiteName}".`),
    );
  };

  const handleBuy = async (addon: PlanAddon) => {
    setBuyingId(addon.id);
    try {
      await processAddonCheckout([addon.id]);
    } catch (buyError) {
      const detail =
        buyError instanceof Error ? buyError.message : "Unable to buy add-on.";
      if (detail !== "Payment cancelled.") setError(detail);
    } finally {
      setBuyingId(null);
    }
  };

  const handleBuySelected = async () => {
    if (selectedAddonIds.length === 0) {
      setError("Select at least one add-on to continue.");
      return;
    }

    setBuyingBundle(true);
    try {
      await processAddonCheckout(selectedAddonIds);
    } catch (buyError) {
      const detail =
        buyError instanceof Error ? buyError.message : "Unable to buy add-ons.";
      if (detail !== "Payment cancelled.") setError(detail);
    } finally {
      setBuyingBundle(false);
    }
  };

  const handleCancel = (addonId: PlanAddonId) => {
    if (!selectedSiteId) return;

    setError("");
    setMessage("");
    setCancellingId(addonId);
    const ok = cancelPurchasedAddon(selectedSiteId, addonId);
    if (ok) {
      setTick((value) => value + 1);
      setMessage(`Add-on cancelled for "${selectedSiteName}". It will no longer renew.`);
    } else {
      setError("Unable to cancel this add-on.");
    }
    setCancellingId(null);
    setCancelConfirmAddonId(null);
  };

  const cancelConfirmAddon = cancelConfirmAddonId
    ? catalog.find((entry) => entry.id === cancelConfirmAddonId) ||
      listPlanAddons().find((entry) => entry.id === cancelConfirmAddonId)
    : null;
  const cancelConfirmItem = cancelConfirmAddonId
    ? purchased.find((entry) => entry.addonId === cancelConfirmAddonId)
    : null;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <section className="relative min-h-full overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
        <div className="pointer-events-none absolute -left-16 top-8 size-64 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 size-72 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1080px]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-white/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.14em] text-amber-700 shadow-sm">
                <Package size={11} /> Per-website add-ons
              </span>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em] text-zinc-950 sm:text-[1.65rem]">
                Website add-ons
              </h2>
              <p className="mt-1 max-w-lg text-[12px] leading-5 text-zinc-500">
                Extras for one website at a time — pick a Core site, then buy
                or manage add-ons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("Plan")}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-[11px] font-semibold text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              Go to Plan
              <ArrowRight size={13} />
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}

          {!storageReady ? (
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white px-5 py-10 shadow-sm">
              <div className="mx-auto flex max-w-xs flex-col items-center gap-3 text-center">
                <Loader2
                  size={22}
                  className="animate-spin text-zinc-400"
                  aria-hidden
                />
                <p className="text-[12px] text-zinc-500">Loading add-ons…</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_10px_40px_rgba(24,39,75,.07)]">
                <div className="border-b border-zinc-100 bg-gradient-to-r from-amber-50/60 via-white to-blue-50/40 px-3 py-2.5 sm:px-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">
                    Select website
                  </p>
                </div>
                <div className="p-3 sm:p-4">
                  {loadingSites ? (
                    <div className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-500">
                      <Loader2 size={14} className="animate-spin" />
                      Loading websites...
                    </div>
                  ) : coreSites.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-[11px] text-zinc-500">
                      No Core websites yet. Upgrade a published site on Plan
                      first.
                    </div>
                  ) : (
                    <div className="relative max-w-md">
                      <Globe2
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                      <select
                        value={selectedSiteId}
                        onChange={(event) =>
                          setSelectedSiteId(event.target.value)
                        }
                        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-9 text-xs font-medium text-zinc-800 outline-none transition hover:border-zinc-300 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-50"
                        aria-label="Select website for add-ons"
                      >
                        {coreSites.map((site) => {
                          const siteName =
                            site.title?.trim() || "Untitled website";
                          return (
                            <option key={site.id} value={site.id}>
                              {siteName} · Core
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                    </div>
                  )}

                  {selectedSite ? (
                    <div className="mt-3 flex flex-col gap-2.5 rounded-xl bg-zinc-50/80 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[11px] leading-5 text-zinc-600">
                        <span className="font-semibold text-zinc-900">
                          {selectedSiteName}
                        </span>
                        {selectedSite.slug ? (
                          <>
                            {" "}
                            ·{" "}
                            <span className="font-mono text-[10px] text-zinc-500">
                              /published/{selectedSite.slug}
                            </span>
                          </>
                        ) : null}
                        {" · "}
                        Core {activeCycle === "yearly" ? "Yearly" : "Monthly"}
                        {siteSubscription?.expiresAt
                          ? ` · Renews ${formatAddonDate(siteSubscription.expiresAt)}`
                          : null}
                      </p>
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                        <Crown size={9} />
                        Core active
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {coreSites.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-zinc-800">
                    Upgrade a website to Core first
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Add-ons are sold per website. Open Plan and upgrade a
                    published site.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate("Plan")}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    Open Plan
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : selectedSite ? (
                <>
                  <div className="mt-5 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_10px_35px_rgba(24,39,75,.06)] sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          Active on {selectedSiteName}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          Cancel anytime — access stays until period ends.
                        </p>
                      </div>
                      {purchased.length > 0 ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-100">
                          {purchased.length} active
                        </span>
                      ) : null}
                    </div>

                    {purchased.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center">
                        <Package
                          size={22}
                          className="mx-auto text-zinc-300"
                          aria-hidden
                        />
                        <p className="mt-2 text-[12px] font-medium text-zinc-600">
                          No add-ons yet
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Buy extras for this website below.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {purchased.map((item) => (
                          <ActiveAddonRow
                            key={`${item.siteId}-${item.addonId}`}
                            item={item}
                            cancelling={cancellingId === item.addonId}
                            onCancel={() =>
                              setCancelConfirmAddonId(item.addonId)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_10px_35px_rgba(24,39,75,.06)] sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          Buy for {selectedSiteName}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-zinc-500">
                          <span className="font-semibold text-zinc-700">
                            {activeCycle === "yearly" ? "Yearly" : "Monthly"}
                          </span>{" "}
                          pricing · matches Core plan
                        </p>
                      </div>

                      <div className="inline-flex w-full items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setBuyMode("single")}
                          className={`flex-1 rounded-lg px-4 py-2 text-[11px] font-semibold transition sm:flex-none ${
                            buyMode === "single"
                              ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80"
                              : "text-zinc-500 hover:text-zinc-800"
                          }`}
                        >
                          One at a time
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyMode("multiple")}
                          className={`flex-1 rounded-lg px-4 py-2 text-[11px] font-semibold transition sm:flex-none ${
                            buyMode === "multiple"
                              ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80"
                              : "text-zinc-500 hover:text-zinc-800"
                          }`}
                        >
                          Select multiple
                        </button>
                      </div>
                    </div>

                    {buyMode === "multiple" && selectedAddonIds.length > 0 ? (
                      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[12px] font-semibold text-amber-950">
                            {selectedAddonIds.length} selected ·{" "}
                            {formatInr(bundleTotalInr)}
                            {activeCycle === "yearly" ? "/yr" : "/mo"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-amber-900/70">
                            {formatAddonBundleLabel(
                              selectedAddonIds,
                              activeCycle || "monthly",
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isPaying}
                          onClick={() => void handleBuySelected()}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60"
                        >
                          {buyingBundle ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Opening Razorpay...
                            </>
                          ) : (
                            <>
                              Pay {formatInr(bundleTotalInr)}
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    ) : buyMode === "multiple" ? (
                      <p className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-2 text-center text-[10px] text-zinc-500">
                        Select one or more add-ons below, then pay together in
                        one checkout.
                      </p>
                    ) : null}

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      {catalog.map((addon) => {
                        const active = hasActiveAddon(selectedSite.id, addon.id);
                        const buying = buyingId === addon.id;
                        const checked = selectedAddonIds.includes(addon.id);
                        const cycle = activeCycle || "monthly";
                        const price = getAddonPrice(addon, cycle);
                        const Icon = addonIcon(addon.id);

                        return (
                          <article
                            key={addon.id}
                            className={`flex flex-col rounded-[20px] border bg-white p-5 shadow-[0_12px_35px_rgba(24,39,75,.06)] transition hover:shadow-[0_16px_40px_rgba(24,39,75,.09)] ${
                              active
                                ? "border-emerald-200/80 bg-gradient-to-b from-emerald-50/30 to-white"
                                : buyMode === "multiple" && checked
                                  ? "border-amber-300 ring-2 ring-amber-100"
                                  : "border-zinc-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span
                                className={`grid size-10 place-items-center rounded-xl ${
                                  active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                <Icon size={18} />
                              </span>
                              {active ? (
                                <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                                  Active
                                </span>
                              ) : buyMode === "multiple" ? (
                                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-zinc-600">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={isPaying}
                                    onChange={() =>
                                      toggleSelectedAddon(addon.id)
                                    }
                                    className="size-3.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                                  />
                                  Select
                                </label>
                              ) : null}
                            </div>
                            <h4 className="mt-4 text-[15px] font-semibold text-zinc-950">
                              {addon.name}
                            </h4>
                            <div className="mt-2 flex items-end gap-1">
                              <strong className="text-2xl tracking-[-.04em] text-zinc-950">
                                {formatInr(price.displayAmount)}
                              </strong>
                              <span className="pb-0.5 text-[11px] text-zinc-500">
                                {price.displaySuffix}
                              </span>
                            </div>
                            <p className="mt-2 min-h-[36px] text-[11px] leading-5 text-zinc-500">
                              {addon.description}
                            </p>
                            {buyMode === "single" ? (
                              <button
                                type="button"
                                disabled={active || isPaying}
                                onClick={() => void handleBuy(addon)}
                                className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                                  active
                                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "bg-zinc-950 text-white hover:bg-zinc-800"
                                }`}
                              >
                                {buying ? (
                                  <>
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                    Opening Razorpay...
                                  </>
                                ) : active ? (
                                  "Active on this site"
                                ) : (
                                  <>
                                    Buy now
                                    <ArrowRight size={14} />
                                  </>
                                )}
                              </button>
                            ) : active ? (
                              <div className="mt-4 flex h-10 w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[12px] font-medium text-emerald-700">
                                Active on this site
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isPaying}
                                onClick={() => toggleSelectedAddon(addon.id)}
                                className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[12px] font-semibold transition disabled:opacity-60 ${
                                  checked
                                    ? "border border-amber-300 bg-amber-50 text-amber-900 shadow-sm"
                                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-amber-200 hover:bg-amber-50/50"
                                }`}
                              >
                                {checked ? "Selected ✓" : "Add to selection"}
                              </button>
                            )}
                            <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                              {addon.features.slice(0, 3).map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-start gap-2 text-[11px] leading-4 text-zinc-600"
                                >
                                  <span className="mt-0.5 grid size-3.5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                                    <Check size={8} strokeWidth={3} />
                                  </span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </article>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-gradient-to-r from-white to-zinc-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-600 text-white shadow-sm">
                        <ShieldCheck size={16} />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-zinc-800">
                          Secure Razorpay checkout
                        </p>
                        <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">
                          Add-ons attach to one website. Cancel anytime from
                          Active section above.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate("Billing")}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-[11px] font-semibold text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                    >
                      Billing & invoices
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </section>

      {cancelConfirmAddonId && cancelConfirmAddon && selectedSite ? (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close cancel add-on confirmation"
            onClick={() => setCancelConfirmAddonId(null)}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-addon-title"
            aria-describedby="cancel-addon-description"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 text-center shadow-[0_30px_90px_rgba(15,23,42,.3)]"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-red-100/70 blur-3xl" />
            <div className="relative">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/60">
                <Trash2 size={24} strokeWidth={2.2} />
              </span>
              <h3
                id="cancel-addon-title"
                className="mt-6 text-xl font-semibold tracking-tight text-zinc-950"
              >
                Cancel {cancelConfirmAddon.name}?
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-[11px] font-medium text-amber-800">
                Website: {selectedSiteName}
              </p>
              <p
                id="cancel-addon-description"
                className="mx-auto mt-2 max-w-xs text-[12px] leading-5 text-zinc-500"
              >
                This add-on will stop renewing for{" "}
                <span className="font-semibold text-zinc-700">
                  {selectedSiteName}
                </span>
                {cancelConfirmItem?.expiresAt
                  ? ` after ${formatAddonDate(cancelConfirmItem.expiresAt)}`
                  : " at the end of the current billing period"}
                . Other websites are not affected.
              </p>

              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCancelConfirmAddonId(null)}
                  disabled={cancellingId === cancelConfirmAddonId}
                  className="h-11 flex-1 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Keep add-on
                </button>
                <button
                  type="button"
                  onClick={() => handleCancel(cancelConfirmAddonId)}
                  disabled={cancellingId === cancelConfirmAddonId}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(120deg,#ef4444,#dc2626)] text-xs font-semibold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancellingId === cancelConfirmAddonId ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Cancel add-on
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ActiveAddonRow({
  item,
  cancelling,
  onCancel,
}: {
  item: PurchasedAddon;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const addon = listPlanAddons().find((entry) => entry.id === item.addonId);
  const live = getPurchasedAddon(item.siteId, item.addonId);
  const Icon = addonIcon(item.addonId);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-amber-700 shadow-sm ring-1 ring-zinc-100">
          <Icon size={16} />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-zinc-900">
            {addon?.name || item.addonId}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {item.cycle === "yearly" ? "Yearly" : "Monthly"}
            {live?.expiresAt
              ? ` · Until ${formatAddonDate(live.expiresAt)}`
              : null}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={cancelling}
        onClick={onCancel}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
      >
        {cancelling ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Trash2 size={13} />
        )}
        Cancel
      </button>
    </div>
  );
}
