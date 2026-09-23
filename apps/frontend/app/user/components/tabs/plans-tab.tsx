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
  Sparkles,
  Zap,
} from "lucide-react";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import { redirectToAuth, consumePlanReturnUrl, setPlanSuccessMessage } from "@/lib/authReturn";
import { getLastEditorUrl, getUserActiveSiteId } from "@/lib/migrateGuestSite";
import SavedCardPickerModal from "../SavedCardPickerModal";
import { buildRazorpayPrefill } from "@/lib/razorpayPrefill";
import {
  buildRazorpayCheckoutOptions,
  fetchSavedPaymentMethods,
  markSavedCardPickerUnavailable,
  shouldSkipSavedCardPicker,
  waitForRazorpayScript,
  type SavedPaymentMethod,
} from "@/lib/razorpayCheckout";
import {
  getAddonPrice,
  listPlanAddons,
  sumAddonDisplayAmount,
  type PlanAddonId,
} from "@/lib/planAddons";
import {
  formatInr,
  getRazorpayPlan,
  type PlanCycle,
} from "@/lib/razorpayPlans";
import { normalizeIndianPhone } from "@/lib/userProfileExtras";
import {
  canSwitchCoreToYearly,
  getSiteSubscription,
  isCorePlanActive,
  saveCoreSubscription,
  stashPendingCoreApply,
} from "@/lib/userPlan";
import { flushUserStateSync } from "@/lib/userStateSync";
import { savePurchasedAddons } from "@/lib/userAddons";
import type { DashboardTab } from "../sidebar";
import type { UserSite } from "../types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const starterFeatures = [
  "No limits on websites, pages, or publishing",
  "Full website builder and editor access",
  "Publish on a shared domain (/published/your-site-name)",
  "Live sites work like your current published URLs",
  "No AI content, image, or design generation",
  "Free forever",
];

const coreFeatures = [
  "Everything included in Starter",
  "AI content writing and editing",
  "AI image generation and replacement",
  "AI-powered section and design changes",
  "Free hosting included",
  "Connect your own custom domain",
  "Domain stays yours — client-owned domain",
  "SSL included on custom domain",
];

type PlansTabProps = {
  sites: UserSite[];
  loadingSites?: boolean;
  onNavigate?: (tab: DashboardTab) => void;
};

type PendingCheckout = {
  orderData: {
    keyId: string;
    customerId?: string;
    orderId: string;
    amount?: number;
    currency?: string;
    planName?: string;
    displayPrice?: string;
  };
  prefill: ReturnType<typeof buildRazorpayPrefill>;
  paymentCycle: PlanCycle;
  isSwitch: boolean;
  selectedAddonIds: PlanAddonId[];
  sitePayload: {
    siteId: string;
    siteTitle: string;
    siteSlug?: string;
  };
  checkoutLabel: string;
};

export default function PlansTab({
  sites,
  loadingSites = false,
  onNavigate,
}: PlansTabProps) {
  const { user, loading: authLoading } = useUserAuth();
  const searchParams = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<PlanCycle>("monthly");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const [planTick, setPlanTick] = useState(0);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [showSavedCardPicker, setShowSavedCardPicker] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(
    null,
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<PlanAddonId[]>([]);
  const [showAddonOptions, setShowAddonOptions] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const pricing = getRazorpayPlan(billingCycle);
  const addons = useMemo(() => listPlanAddons(), []);
  const addonExtraInr = useMemo(
    () => sumAddonDisplayAmount(selectedAddonIds, billingCycle),
    [selectedAddonIds, billingCycle],
  );
  const checkoutTotalInr = pricing.chargeDisplayInr + addonExtraInr;

  const querySiteId = searchParams.get("siteId")?.trim() || "";
  const querySiteTitle = searchParams.get("siteTitle")?.trim() || "";

  const upgradeableSites = useMemo(() => {
    const list = [...sites];
    if (querySiteId && !list.some((site) => site.id === querySiteId)) {
      list.unshift({
        id: querySiteId,
        title: querySiteTitle || "This website",
        slug: "",
        status: "draft",
        templateId: null,
        category: null,
        published: false,
        publishedAt: null,
        updatedAt: new Date().toISOString(),
      });
    }
    return list;
  }, [sites, querySiteId, querySiteTitle]);

  const selectedSite = useMemo(
    () => upgradeableSites.find((site) => site.id === selectedSiteId) || null,
    [upgradeableSites, selectedSiteId],
  );

  const selectedSiteName =
    selectedSite?.title?.trim() || "Untitled website";

  useEffect(() => {
    if (loadingSites) return;

    const pickIfExists = (id: string | null | undefined) =>
      id && upgradeableSites.some((site) => site.id === id) ? id : null;

    const preferred =
      pickIfExists(querySiteId) ||
      pickIfExists(getUserActiveSiteId()) ||
      upgradeableSites[0]?.id ||
      "";

    setSelectedSiteId((current) => {
      if (querySiteId && upgradeableSites.some((site) => site.id === querySiteId)) {
        return querySiteId;
      }
      if (current && upgradeableSites.some((site) => site.id === current)) {
        return current;
      }
      return preferred;
    });
  }, [loadingSites, upgradeableSites, querySiteId, searchParams]);

  useEffect(() => {
    setSelectedAddonIds([]);
    setShowAddonOptions(false);
  }, [billingCycle]);

  useEffect(() => {
    setStorageReady(true);
    const refresh = () => setPlanTick((tick) => tick + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }
    const timer = window.setInterval(() => {
      if (window.Razorpay) {
        setScriptReady(true);
        window.clearInterval(timer);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMessage("");
    setError("");
  }, [selectedSiteId]);

  const hasCore = useMemo(() => {
    if (!storageReady || !selectedSiteId) return false;
    void planTick;
    return isCorePlanActive(selectedSiteId);
  }, [planTick, selectedSiteId, storageReady]);

  const subscription = useMemo(() => {
    if (!storageReady || !selectedSiteId) return null;
    void planTick;
    return getSiteSubscription(selectedSiteId);
  }, [planTick, selectedSiteId, storageReady]);

  const activeCycle =
    subscription?.planId === "core" && hasCore
      ? subscription.cycle === "yearly"
        ? "yearly"
        : "monthly"
      : null;

  const switchingToYearly =
    hasCore && activeCycle === "monthly" && billingCycle === "yearly";

  useEffect(() => {
    setBillingCycle("monthly");
  }, [selectedSiteId]);

  const completePayment = (
    paymentCycle: PlanCycle,
    paymentId: string,
    orderId: string,
    sitePayload: {
      siteId: string;
      siteTitle: string;
      siteSlug?: string;
    },
    verifyMessage?: string,
    isSwitch = false,
    addonIds: PlanAddonId[] = [],
  ) => {
    const readSiteIdFromPath = (path: string) => {
      try {
        const url = path.startsWith("http")
          ? new URL(path)
          : new URL(path, window.location.origin);
        return url.searchParams.get("siteId")?.trim() || "";
      } catch {
        return "";
      }
    };

    const returnUrl = consumePlanReturnUrl();
    const lastEditor = getLastEditorUrl();
    const dest =
      returnUrl ||
      (lastEditor.startsWith("/editor?") ? lastEditor : null);
    const editorSiteId =
      readSiteIdFromPath(dest || "") || querySiteId || sitePayload.siteId;
    const editorSite = upgradeableSites.find((site) => site.id === editorSiteId);
    const paidPayload = {
      siteId: editorSiteId || sitePayload.siteId,
      siteTitle:
        editorSite?.title?.trim() ||
        sitePayload.siteTitle ||
        "Untitled website",
      siteSlug: editorSite?.slug || sitePayload.siteSlug,
    };

    saveCoreSubscription({
      cycle: paymentCycle,
      paymentId,
      orderId,
      ...paidPayload,
    });
    stashPendingCoreApply({
      cycle: paymentCycle,
      paymentId,
      orderId,
      ...paidPayload,
    });
    if (addonIds.length > 0) {
      savePurchasedAddons(addonIds, {
        siteId: paidPayload.siteId,
        siteTitle: paidPayload.siteTitle,
        siteSlug: paidPayload.siteSlug,
        cycle: paymentCycle,
        paymentId,
        orderId,
      });
    }
    const addonNames = addonIds
      .map((id) => addons.find((addon) => addon.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    const successMessage =
      verifyMessage ||
      (isSwitch
        ? `Switched to Core Yearly for "${paidPayload.siteTitle}".`
        : `Core plan activated for "${paidPayload.siteTitle}".`);
    const fullMessage =
      addonNames.length > 0
        ? `${successMessage} Add-ons: ${addonNames.join(", ")}.`
        : successMessage;

    setPlanTick((tick) => tick + 1);
    setSelectedAddonIds([]);

    const finishRedirect = () => {
      if (!dest) {
        setMessage(fullMessage);
        return;
      }
      setPlanSuccessMessage(fullMessage);
      let destWithSite = dest;
      try {
        const url = dest.startsWith("http")
          ? new URL(dest)
          : new URL(dest, window.location.origin);
        if (paidPayload.siteId) url.searchParams.set("siteId", paidPayload.siteId);
        destWithSite = `${url.pathname}${url.search}${url.hash}`;
      } catch {
        destWithSite = dest;
      }
      window.location.replace(destWithSite);
    };

    void flushUserStateSync().finally(finishRedirect);
  };

  const openRazorpayForCheckout = async (checkout: PendingCheckout) => {
    await waitForRazorpayScript();
    if (!window.Razorpay) {
      throw new Error("Payment gateway is still loading. Please try again.");
    }

    const useSavedCards =
      Boolean(checkout.orderData.customerId) &&
      Boolean(checkout.prefill.email) &&
      Boolean(checkout.prefill.contact);

    const razorpay = new window.Razorpay({
      ...buildRazorpayCheckoutOptions({
        keyId: checkout.orderData.keyId,
        orderId: checkout.orderData.orderId,
        amount: checkout.orderData.amount ?? pricing.chargeAmount,
        currency: checkout.orderData.currency || "INR",
        customerId: checkout.orderData.customerId,
        rememberCustomer: Boolean(checkout.orderData.customerId),
        description: checkout.checkoutLabel,
        prefill: checkout.prefill,
        preferSavedCards: useSavedCards,
        method: useSavedCards ? "card" : undefined,
        notes: {
          ...checkout.sitePayload,
          switchToYearly: checkout.isSwitch ? "true" : "false",
        },
      }),
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyResponse = await fetch(
            "/api/user/payments/razorpay/verify",
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                cycle: checkout.paymentCycle,
                switchToYearly: checkout.isSwitch,
                addonIds: checkout.selectedAddonIds,
                ...checkout.sitePayload,
              }),
            },
          );

          const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
            message?: string;
            addonIds?: PlanAddonId[];
          };

          if (!verifyResponse.ok) {
            throw new Error(verifyData.message || "Payment verification failed.");
          }

          completePayment(
            checkout.paymentCycle,
            response.razorpay_payment_id,
            response.razorpay_order_id,
            checkout.sitePayload,
            verifyData.message,
            checkout.isSwitch,
            verifyData.addonIds || checkout.selectedAddonIds,
          );
        } catch (verifyError) {
          setError(
            verifyError instanceof Error
              ? verifyError.message
              : "Payment verification failed.",
          );
        } finally {
          setPaying(false);
          setPendingCheckout(null);
          setShowSavedCardPicker(false);
        }
      },
      modal: {
        ondismiss: () => {
          setPaying(false);
        },
      },
    });

    razorpay.on("payment.failed", (response: unknown) => {
      setPaying(false);
      const failure = response as {
        error?: { description?: string; reason?: string };
      };
      const detail =
        failure.error?.description ||
        failure.error?.reason ||
        "Payment failed. Please try again.";
      setError(
        detail.includes("domestic")
          ? `${detail} Use an Indian test card (4111 1111 1111 1111) or UPI (success@razorpay) in test mode.`
          : detail,
      );
    });

    razorpay.open();
  };

  const closeSavedCardPicker = () => {
    setShowSavedCardPicker(false);
    setPendingCheckout(null);
    setSavedMethods([]);
    setPaying(false);
  };

  const handlePayWithSavedCard = async (
    method: SavedPaymentMethod,
    cvv: string,
  ) => {
    if (!pendingCheckout || !user) return;

    setPaying(true);
    setError("");

    try {
      const contact = normalizeIndianPhone(user.phone || "");
      const payResponse = await fetch(
        "/api/user/payments/razorpay/pay-with-token",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: pendingCheckout.orderData.orderId,
            tokenId: method.id,
            customerId: pendingCheckout.orderData.customerId,
            cvv,
            contact: contact || undefined,
            cycle: pendingCheckout.paymentCycle,
            switchToYearly: pendingCheckout.isSwitch,
            ...pendingCheckout.sitePayload,
          }),
        },
      );

      const payData = (await payResponse.json().catch(() => ({}))) as {
        ok?: boolean;
        fallbackToCheckout?: boolean;
        requiresAuth?: boolean;
        authUrl?: string;
        paymentId?: string;
        orderId?: string;
        signature?: string;
        message?: string;
      };

      if (payData.requiresAuth && payData.authUrl) {
        window.location.href = payData.authUrl;
        return;
      }

      if (payData.fallbackToCheckout && pendingCheckout) {
        markSavedCardPickerUnavailable();
        setShowSavedCardPicker(false);
        setMessage(
          payData.message ||
            "Saved card quick pay is not available. Opening Razorpay checkout…",
        );
        setError("");
        void openRazorpayForCheckout(pendingCheckout);
        return;
      }

      if (!payResponse.ok || !payData.ok || !payData.paymentId || !payData.orderId) {
        throw new Error(payData.message || "Saved card payment failed.");
      }

      if (payData.signature && payData.signature !== "mock_signature") {
        const verifyResponse = await fetch("/api/user/payments/razorpay/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: payData.paymentId,
            razorpay_order_id: payData.orderId,
            razorpay_signature: payData.signature,
            cycle: pendingCheckout.paymentCycle,
            switchToYearly: pendingCheckout.isSwitch,
            addonIds: pendingCheckout.selectedAddonIds,
            ...pendingCheckout.sitePayload,
          }),
        });
        const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
          message?: string;
          addonIds?: PlanAddonId[];
        };
        if (!verifyResponse.ok) {
          throw new Error(verifyData.message || "Payment verification failed.");
        }
        completePayment(
          pendingCheckout.paymentCycle,
          payData.paymentId,
          payData.orderId,
          pendingCheckout.sitePayload,
          verifyData.message || payData.message,
          pendingCheckout.isSwitch,
          verifyData.addonIds || pendingCheckout.selectedAddonIds,
        );
      } else {
        completePayment(
          pendingCheckout.paymentCycle,
          payData.paymentId,
          payData.orderId,
          pendingCheckout.sitePayload,
          payData.message,
          pendingCheckout.isSwitch,
          pendingCheckout.selectedAddonIds,
        );
      }

      setShowSavedCardPicker(false);
      setPendingCheckout(null);
      setSavedMethods([]);
    } catch (payError) {
      const detail =
        payError instanceof Error
          ? payError.message
          : "Unable to charge saved card.";
      if (
        pendingCheckout &&
        detail.toLowerCase().includes("requested url was not found")
      ) {
        markSavedCardPickerUnavailable();
        setShowSavedCardPicker(false);
        setMessage(
          "Saved card quick pay is not enabled on Razorpay. Opening standard checkout…",
        );
        setError("");
        void openRazorpayForCheckout(pendingCheckout);
        return;
      }
      setError(detail);
    } finally {
      setPaying(false);
    }
  };

  const handleOtherPaymentMethod = () => {
    if (!pendingCheckout) return;

    setPaying(true);
    try {
      void openRazorpayForCheckout(pendingCheckout);
      setShowSavedCardPicker(false);
    } catch (otherMethodError) {
      setPaying(false);
      setError(
        otherMethodError instanceof Error
          ? otherMethodError.message
          : "Unable to start payment.",
      );
    }
  };

  const handleUpgrade = async () => {
    setError("");
    setMessage("");

    if (authLoading) return;

    if (!user) {
      redirectToAuth({
        returnUrl: selectedSiteId
          ? `/user/plan?siteId=${encodeURIComponent(selectedSiteId)}`
          : "/user/plan",
      });
      return;
    }

    if (!selectedSite) {
      setError("Select a website first. Core plan is billed per website.");
      return;
    }

    const isSwitch = canSwitchCoreToYearly(selectedSite.id) && billingCycle === "yearly";

    if (isCorePlanActive(selectedSite.id) && !isSwitch) {
      setError("This website already has an active Core plan.");
      return;
    }

    const paymentCycle: PlanCycle = isSwitch ? "yearly" : billingCycle;
    const contact = normalizeIndianPhone(user.phone || "");
    const prefill = buildRazorpayPrefill(user);

    setPaying(true);

    const sitePayload = {
      siteId: selectedSite.id,
      siteTitle: selectedSite.title || "Untitled website",
      siteSlug: selectedSite.slug,
    };

    try {
      const orderResponse = await fetch("/api/user/payments/razorpay/order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle: paymentCycle,
          switchToYearly: isSwitch,
          contact: contact || undefined,
          addonIds: selectedAddonIds,
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
        planName?: string;
        displayPrice?: string;
        savedCardCount?: number;
        message?: string;
      };

      if (!orderResponse.ok || !orderData.orderId) {
        throw new Error(orderData.message || "Unable to start payment.");
      }

      if (orderData.mock) {
        const verifyResponse = await fetch("/api/user/payments/razorpay/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_order_id: orderData.orderId,
            razorpay_signature: "mock_signature",
            cycle: paymentCycle,
            addonIds: selectedAddonIds,
            ...sitePayload,
          }),
        });

        const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
          message?: string;
          addonIds?: PlanAddonId[];
        };

        if (!verifyResponse.ok) {
          throw new Error(verifyData.message || "Mock payment verification failed.");
        }

        const mockPaymentId = `pay_mock_${Date.now()}`;
        completePayment(
          paymentCycle,
          mockPaymentId,
          orderData.orderId,
          sitePayload,
          verifyData.message,
          isSwitch,
          verifyData.addonIds || selectedAddonIds,
        );
        setPaying(false);
        return;
      }

      if (!orderData.keyId) {
        throw new Error("Unable to start Razorpay checkout.");
      }

      await waitForRazorpayScript();

      const checkoutLabel = isSwitch
        ? `Switch to Core Yearly · ${orderData.displayPrice || formatInr(checkoutTotalInr)}`
        : `${orderData.planName || `Core ${paymentCycle}`} · ${sitePayload.siteTitle} (${orderData.displayPrice || formatInr(checkoutTotalInr)})`;

      const checkoutContext: PendingCheckout = {
        orderData: {
          keyId: orderData.keyId,
          customerId: orderData.customerId,
          orderId: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency,
          planName: orderData.planName,
          displayPrice: orderData.displayPrice,
        },
        prefill,
        paymentCycle,
        isSwitch,
        selectedAddonIds,
        sitePayload,
        checkoutLabel,
      };

      const methods = shouldSkipSavedCardPicker()
        ? []
        : await fetchSavedPaymentMethods();

      if (methods.length > 0) {
        setSavedMethods(methods);
        setPendingCheckout(checkoutContext);
        setShowSavedCardPicker(true);
        setPaying(false);
        return;
      }

      void openRazorpayForCheckout(checkoutContext);
    } catch (upgradeError) {
      setPaying(false);
      setError(
        upgradeError instanceof Error
          ? upgradeError.message
          : "Unable to start payment.",
      );
    }
  };

  const toggleAddon = (addonId: PlanAddonId) => {
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId],
    );
  };

  const canSelectAddonsOnPlan = !hasCore;

  useEffect(() => {
    if (!canSelectAddonsOnPlan) {
      setSelectedAddonIds([]);
    }
  }, [canSelectAddonsOnPlan]);

  useEffect(() => {
    setShowAddonOptions(false);
  }, [selectedSiteId]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />

      <SavedCardPickerModal
        open={showSavedCardPicker}
        loading={paying}
        amountLabel={pendingCheckout?.checkoutLabel || ""}
        methods={savedMethods}
        onPayWithCard={(method, cvv) => void handlePayWithSavedCard(method, cvv)}
        onUseOtherMethod={handleOtherPaymentMethod}
        onClose={closeSavedCardPicker}
      />

    <section className="relative min-h-full overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-9">
      <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-28 size-80 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1080px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.14em] text-blue-700 shadow-sm">
              <Sparkles size={11} /> Per-website pricing
          </span>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.025em] text-zinc-950 sm:text-[1.65rem]">
              Upgrade one website at a time
          </h2>
            <p className="mt-1 max-w-lg text-[12px] leading-5 text-zinc-500">
              Pick a site, choose billing, then upgrade — other sites stay on
              free Starter.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_10px_40px_rgba(24,39,75,.07)]">
          <div className="border-b border-zinc-100 bg-gradient-to-r from-blue-50/50 via-white to-emerald-50/40 px-3 py-2.5 sm:px-4">
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-500">
              Configure upgrade
            </p>
          </div>
          <div className="p-3 sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                Website
              </label>
              {loadingSites ? (
                <div className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-500">
                  <Loader2 size={14} className="animate-spin" />
                  Loading...
                </div>
              ) : upgradeableSites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2.5 text-[11px] text-zinc-500">
                  Open a website in the editor first to upgrade.
                </div>
              ) : (
                <div className="relative">
                  <Globe2
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <select
                    value={selectedSiteId}
                    onChange={(event) => setSelectedSiteId(event.target.value)}
                    className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-9 text-xs font-medium text-zinc-800 outline-none transition hover:border-zinc-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    aria-label="Select website to upgrade"
                  >
                    {upgradeableSites.map((site) => {
                      const core =
                        storageReady && isCorePlanActive(site.id);
                      const siteName = site.title?.trim() || "Untitled website";
                      return (
                        <option key={site.id} value={site.id}>
                          {siteName} · {core ? "Core" : "Starter"}
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
            </div>

            <div className="lg:text-right">
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                Billing
              </p>
              <div className="inline-flex w-full items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 lg:w-auto">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  disabled={hasCore && activeCycle === "yearly" && !switchingToYearly}
                  className={`flex-1 rounded-lg px-4 py-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 lg:flex-none ${
                    billingCycle === "monthly"
                      ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-semibold transition lg:flex-none ${
                    billingCycle === "yearly"
                      ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/80"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  Yearly
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                      billingCycle === "yearly"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    -22%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {selectedSite && storageReady ? (
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
                {hasCore
                  ? `Core ${activeCycle === "yearly" ? "Yearly" : "Monthly"}`
                  : "Starter (free)"}
                {subscription?.expiresAt && hasCore
                  ? ` · Renews ${formatPlanDate(subscription.expiresAt)}`
                  : null}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider ring-1 ${
                    hasCore
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : "bg-white text-zinc-600 ring-zinc-200"
                  }`}
                >
                  {hasCore ? <Crown size={9} /> : <Zap size={9} />}
                  {hasCore ? "Core active" : "On Starter"}
                </span>
                {hasCore && onNavigate ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = selectedSiteId
                        ? `/user/addons?siteId=${encodeURIComponent(selectedSiteId)}`
                        : "/user/addons";
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded-lg bg-amber-600 px-2.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-amber-700"
                  >
                    Add-ons
                    <ArrowRight size={11} />
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          </div>
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

        <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2">
          <article
            className={`relative flex flex-col rounded-[24px] border bg-white p-5 shadow-[0_16px_45px_rgba(24,39,75,.07)] transition sm:p-6 ${
              hasCore
                ? "border-zinc-200/80 opacity-[0.92]"
                : "border-zinc-200 ring-1 ring-zinc-100"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Zap size={19} />
              </span>
              {!hasCore && selectedSite ? (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                  Current on {selectedSiteName}
              </span>
              ) : null}
            </div>

            <h3 className="mt-5 text-xl font-semibold text-zinc-950">Starter</h3>
            <div className="mt-2 flex items-end gap-1">
              <strong className="text-4xl tracking-[-.05em] text-zinc-950">
                ₹0
              </strong>
              <span className="pb-1 text-xs text-zinc-500">/month</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              Free for every website. Build and publish on a shared URL. No AI
              tools or custom domain.
            </p>

            <div
              className={`mt-4 flex h-10 items-center justify-center rounded-xl text-xs font-semibold ${
                !hasCore && selectedSite
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-400"
              }`}
            >
              {!hasCore && selectedSite
                ? `${selectedSiteName} is on Starter`
                : "Free tier for all sites"}
            </div>

            <div className="my-5 h-px bg-zinc-100" />
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-400">
              Starter includes
            </p>
            <ul className="mt-3 space-y-2.5">
              {starterFeatures.map((feature) => (
                <PlanFeature key={feature} muted={hasCore}>
                  {feature}
                </PlanFeature>
              ))}
            </ul>
          </article>

          <article
            className={`relative flex flex-col overflow-hidden rounded-[24px] border p-5 shadow-[0_20px_55px_rgba(49,95,244,.15)] transition sm:p-6 ${
              hasCore && !switchingToYearly
                ? "border-emerald-300/80 bg-[linear-gradient(150deg,#ecfdf5_0%,#ffffff_45%,#eff6ff_100%)]"
                : "border-blue-400 bg-[linear-gradient(150deg,#edf4ff_0%,#ffffff_48%,#edfff8_100%)] hover:shadow-[0_24px_60px_rgba(49,95,244,.2)]"
            }`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-emerald-200/35 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Crown size={19} />
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-wider shadow-sm ${
                  hasCore
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {hasCore
                  ? activeCycle === "yearly"
                    ? "Yearly active"
                    : "Monthly active"
                  : billingCycle === "yearly"
                    ? "Save 22%"
                    : "Recommended"}
              </span>
            </div>

            <div className="relative flex flex-1 flex-col">
              <h3 className="mt-5 text-xl font-semibold text-zinc-950">Core</h3>
              <div className="mt-2 flex flex-wrap items-end gap-x-1 gap-y-0.5">
                <strong className="text-4xl tracking-[-.05em] text-zinc-950">
                  ₹{pricing.displayAmount.toLocaleString("en-IN")}
                </strong>
                <span className="pb-1 text-xs text-zinc-500">
                  {pricing.displaySuffix}
                </span>
                <span className="pb-1 text-[10px] font-medium text-zinc-400">
                  per website
                </span>
              </div>
              {"billed" in pricing && billingCycle === "yearly" ? (
                <p className="mt-1 inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  {pricing.billed} · save vs monthly
                </p>
              ) : null}
              <p className="mt-3 text-xs leading-5 text-zinc-600">
                {pricing.note} AI, hosting & custom domain for{" "}
                <span className="font-semibold text-zinc-800">
                  {selectedSiteName}
                </span>
                .
              </p>

              {(!hasCore || switchingToYearly) && selectedSite ? (
                <div className="mt-3 rounded-xl border border-blue-100 bg-white/80 px-3 py-2.5 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-[.14em] text-blue-600">
                    Order summary
                  </p>
                  <div className="mt-2 space-y-1.5 text-[11px] text-zinc-600">
                    <div className="flex justify-between gap-3">
                      <span>
                        Core {billingCycle === "yearly" ? "Yearly" : "Monthly"}
                      </span>
                      <span className="font-medium text-zinc-900">
                        {formatInr(pricing.chargeDisplayInr)}
                        {billingCycle === "yearly" ? "/yr" : "/mo"}
                      </span>
                    </div>
                    {selectedAddonIds.map((addonId) => {
                      const addon = addons.find((a) => a.id === addonId);
                      const price = addon
                        ? getAddonPrice(addon, billingCycle)
                        : null;
                      if (!addon || !price) return null;
                      return (
                        <div key={addonId} className="flex justify-between gap-3">
                          <span>{addon.name}</span>
                          <span className="font-medium text-zinc-900">
                            +{formatInr(price.displayAmount)}
                            {price.displaySuffix}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between gap-3 border-t border-blue-100 pt-1.5 font-semibold text-zinc-900">
                      <span>Total for {selectedSiteName}</span>
                      <span>
                        {formatInr(checkoutTotalInr)}
                        {billingCycle === "yearly" ? "/yr" : "/mo"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                disabled={
                  paying ||
                  !selectedSite ||
                  upgradeableSites.length === 0 ||
                  (hasCore && !switchingToYearly)
                }
                onClick={() => void handleUpgrade()}
                className={`group mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-80 ${
                  hasCore && !switchingToYearly
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "bg-[linear-gradient(120deg,#315ff4,#6b4ff8_56%,#20c997)] text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5 hover:shadow-xl"
                }`}
              >
                  {switchingToYearly ? (
                    <>
                      Switch to Yearly · {formatInr(checkoutTotalInr)}
                      <ArrowRight size={14} />
                    </>
                  ) : hasCore ? (
                    `Core active (${activeCycle === "yearly" ? "Yearly" : "Monthly"})`
                  ) : paying ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Opening Razorpay...
                    </>
                  ) : upgradeableSites.length === 0 ? (
                    "Add a website first"
                  ) : !selectedSite ? (
                    "Select a website first"
                  ) : (
                    <>
                      Upgrade {selectedSiteName} · {formatInr(checkoutTotalInr)}
                      {billingCycle === "yearly" ? "/yr" : "/mo"}
                      {selectedAddonIds.length > 0
                        ? ` (+${selectedAddonIds.length} add-on${selectedAddonIds.length > 1 ? "s" : ""})`
                        : ""}{" "}
                      <ArrowRight size={14} />
                    </>
                  )}
              </button>

                {switchingToYearly ? (
                  <p className="mt-3 text-[11px] font-medium text-blue-700">
                    Switch from Core Monthly to Yearly and save 22%. Your plan
                    renews for 1 year after payment.
                  </p>
                ) : null}

                {hasCore && subscription?.expiresAt ? (
                  <p className="mt-3 text-[11px] font-medium text-emerald-700">
                    Core active on {selectedSiteName} until{" "}
                    {formatPlanDate(subscription.expiresAt)}
                    {activeCycle === "monthly"
                      ? " · Switch to Yearly above to save 22%"
                      : null}
                  </p>
                ) : null}

              <div className="my-5 h-px bg-blue-100/80" />
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-blue-600">
                Core includes
              </p>
              <ul className="mt-3 space-y-2.5">
                {coreFeatures.map((feature) => (
                  <PlanFeature key={feature} accent>
                    {feature}
                  </PlanFeature>
                ))}
              </ul>

              <div className="mt-auto pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddonOptions((open) => !open)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-left transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-amber-900">
                    <Package size={14} />
                    Add-ons (optional)
                  </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {canSelectAddonsOnPlan &&
                      selectedAddonIds.length > 0 &&
                      !showAddonOptions ? (
                        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                          {selectedAddonIds.length} selected
                        </span>
                      ) : null}
                      <span className="grid size-6 place-items-center rounded-md border border-amber-300/80 bg-white text-[14px] font-semibold leading-none text-amber-800">
                        {showAddonOptions ? "−" : "+"}
                      </span>
                    </span>
                  </button>

                  {showAddonOptions ? (
                    canSelectAddonsOnPlan ? (
                      <div className="mt-3 rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,#fffbeb_0%,#fff7ed_55%,#eff6ff_100%)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-amber-700">
                            Add-ons ·{" "}
                            {billingCycle === "yearly" ? "Yearly" : "Monthly"}
                          </p>
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800">
                            Extra
                          </span>
                        </div>
                        <p className="mt-2 text-[10px] leading-4 text-amber-900/70">
                          Tick add-ons to increase total. One Razorpay payment
                          for Core + selected extras.
                        </p>
                        <div className="mt-3 space-y-2">
                          {addons.map((addon) => {
                            const price = getAddonPrice(addon, billingCycle);
                            const checked = selectedAddonIds.includes(addon.id);
                            const Icon = addonIcon(addon.id);
                            return (
                              <label
                                key={addon.id}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${
                                  checked
                                    ? "border-amber-300 bg-white shadow-sm"
                                    : "border-white/80 bg-white/70 hover:border-amber-200 hover:bg-white"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleAddon(addon.id)}
                                  className="size-3.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                                  <Icon size={13} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[12px] font-semibold leading-4 text-zinc-900">
                                    {addon.name}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] text-zinc-500">
                                    +{formatInr(price.displayAmount)}
                                    {price.displaySuffix}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {addonExtraInr > 0 ? (
                          <p className="mt-3 text-[11px] font-semibold text-amber-900">
                            Add-ons +{formatInr(addonExtraInr)} · Total{" "}
                            {formatInr(checkoutTotalInr)}
                            {billingCycle === "yearly" ? "/year" : "/month"}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,#fffbeb_0%,#fff7ed_55%,#eff6ff_100%)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                        <p className="text-[12px] font-medium text-zinc-800">
                          Core already active on this site
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                          Buy, cancel, or manage add-ons from the Addons page.
                        </p>
                        {onNavigate ? (
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = selectedSiteId
                                ? `/user/addons?siteId=${encodeURIComponent(selectedSiteId)}`
                                : "/user/addons";
                            }}
                            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-[10px] font-semibold text-white transition hover:bg-amber-700"
                          >
                            Manage add-ons for {selectedSiteName}
                            <ArrowRight size={12} />
                          </button>
                        ) : null}
                      </div>
                    )
                  ) : null}
                </div>
            </div>
          </article>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-gradient-to-r from-white to-zinc-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
              <ShieldCheck size={16} />
            </span>
            <div>
              <p className="text-xs font-semibold text-zinc-800">
                Secure Razorpay checkout
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">
                One payment unlocks Core for one website. View receipts and
                payment history anytime.
              </p>
            </div>
          </div>
          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate("Billing")}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-[11px] font-semibold text-zinc-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              Billing & invoices
              <ArrowRight size={12} />
            </button>
          ) : null}
        </div>
      </div>
    </section>
    </>
  );
}

function addonIcon(id: PlanAddonId) {
  if (id === "google-my-business") return MapPin;
  if (id === "priority-support") return Headphones;
  return ShieldCheck;
}

function formatPlanDate(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PlanFeature({
  children,
  muted = false,
  accent = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-2 text-[12px] leading-[1.35] ${
        muted ? "text-zinc-400" : "text-zinc-600"
      }`}
    >
      <span
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
          accent
            ? "bg-blue-100 text-blue-700"
            : "bg-emerald-100 text-emerald-700"
        }`}
      >
        <Check size={9} strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}
