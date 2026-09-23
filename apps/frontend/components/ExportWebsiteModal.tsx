"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Script from "next/script";
import { Check, Download, Loader2, X } from "lucide-react";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import {
  EXPORT_MAX_DOWNLOADS,
  EXPORT_PACKAGES,
  formatExportPrice,
  type ExportFormat,
} from "@/lib/exportPricing";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { buildRazorpayPrefill } from "@/lib/razorpayPrefill";
import { formatInr } from "@/lib/razorpayPlans";
import {
  canDownloadExport,
  getExportEntitlement,
  savePurchasedExport,
  setExportDownloadsRemaining,
} from "@/lib/userExports";
import { normalizeIndianPhone } from "@/lib/userProfileExtras";
import { savePersistedUserState } from "@/lib/userStateSync";

export type ExportWebsiteTarget = {
  id: string;
  title?: string | null;
  slug?: string | null;
};

type ExportWebsiteModalProps = {
  open: boolean;
  site: ExportWebsiteTarget | null;
  onClose: () => void;
};

export default function ExportWebsiteModal({
  open,
  site,
  onClose,
}: ExportWebsiteModalProps) {
  const { user } = useUserAuth();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("html");
  const [exportPaying, setExportPaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [entitlementTick, setEntitlementTick] = useState(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setExportFormat("html");
    setExportError("");
  }, [open, site?.id]);

  useEffect(() => {
    const bump = () => setEntitlementTick((value) => value + 1);
    window.addEventListener("storage", bump);
    return () => window.removeEventListener("storage", bump);
  }, []);

  void entitlementTick;

  if (!open || !site) return null;

  const selectedEntitlement = getExportEntitlement(site.id, exportFormat);
  const selectedCanDownload = Boolean(
    selectedEntitlement && selectedEntitlement.downloadsRemaining > 0,
  );
  const selectedPackage = EXPORT_PACKAGES[exportFormat];
  const busy = exportPaying || exporting;
  const siteTitle = site.title?.trim() || "Untitled website";

  const bumpEntitlement = () => setEntitlementTick((value) => value + 1);

  const close = () => {
    if (busy) return;
    onClose();
  };

  const downloadZip = async (format: ExportFormat) => {
    if (!site.slug || inFlightRef.current || exporting) return;
    inFlightRef.current = true;
    setExportError("");
    setExporting(true);
    try {
      const res = await fetch(
        `/api/user/sites/${site.id}/export-${format === "html" ? "html" : "nextjs"}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "Unable to export website");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const matched = disposition.match(/filename=\"([^\"]+)\"/i);
      const filename =
        matched?.[1] ||
        `${site.slug || "website"}-${format === "html" ? "html" : "nextjs"}.zip`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      const remainingHeader = res.headers.get("X-Export-Downloads-Remaining");
      const remaining = Number(remainingHeader);
      if (Number.isFinite(remaining)) {
        setExportDownloadsRemaining(site.id, format, remaining);
      }
      bumpEntitlement();
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Unable to export website",
      );
    } finally {
      inFlightRef.current = false;
      setExporting(false);
    }
  };

  const processPurchase = async () => {
    if (!user || busy) return;
    const format = exportFormat;
    const pricing = EXPORT_PACKAGES[format];

    setExportPaying(true);
    setExportError("");
    try {
      const contact = normalizeIndianPhone(user.phone || "");
      const prefill = buildRazorpayPrefill(user);

      const orderResponse = await fetch("/api/user/sites/export-order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          siteId: site.id,
          siteTitle: site.title || undefined,
          siteSlug: site.slug || undefined,
          contact: contact || undefined,
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
        throw new Error(orderData.message || "Unable to start export payment.");
      }

      let paymentId = `pay_mock_${Date.now()}`;
      let orderId = orderData.orderId;

      const applyPurchase = async (paid: {
        paymentId: string;
        orderId: string;
        amountInr?: number;
      }) => {
        savePurchasedExport({
          siteId: site.id,
          siteTitle: site.title || undefined,
          siteSlug: site.slug || undefined,
          format,
          paymentId: paid.paymentId,
          orderId: paid.orderId,
          amountInr: paid.amountInr || pricing.priceInr,
        });
        await savePersistedUserState().catch(() => undefined);
        bumpEntitlement();
        setExportPaying(false);
        await downloadZip(format);
      };

      if (orderData.mock) {
        const verifyResponse = await fetch("/api/user/sites/export-verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: "mock_signature",
            format,
            siteId: site.id,
            siteTitle: site.title || undefined,
            siteSlug: site.slug || undefined,
          }),
        });
        const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
          message?: string;
          paymentId?: string;
          orderId?: string;
          amountInr?: number;
        };
        if (!verifyResponse.ok) {
          throw new Error(verifyData.message || "Payment verification failed.");
        }
        await applyPurchase({
          paymentId: verifyData.paymentId || paymentId,
          orderId: verifyData.orderId || orderId,
          amountInr: verifyData.amountInr,
        });
        return;
      }

      if (!orderData.keyId) {
        throw new Error("Unable to start Razorpay checkout.");
      }

      const payment = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount ?? pricing.chargeAmount,
        currency: orderData.currency ?? "INR",
        customerId: orderData.customerId,
        rememberCustomer: Boolean(orderData.customerId),
        preferSavedCards: true,
        name: "CSS Founder",
        description: `${pricing.label} — ${siteTitle} (${orderData.displayPrice || formatInr(pricing.priceInr)})`,
        prefill,
        notes: {
          purpose: "website_export",
          format,
          siteId: site.id,
        },
      });

      const verifyResponse = await fetch("/api/user/sites/export-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payment,
          format,
          siteId: site.id,
          siteTitle: site.title || undefined,
          siteSlug: site.slug || undefined,
        }),
      });
      const verifyData = (await verifyResponse.json().catch(() => ({}))) as {
        message?: string;
        paymentId?: string;
        orderId?: string;
        amountInr?: number;
      };
      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || "Payment verification failed.");
      }

      await applyPurchase({
        paymentId: verifyData.paymentId || payment.razorpay_payment_id,
        orderId: verifyData.orderId || payment.razorpay_order_id,
        amountInr: verifyData.amountInr,
      });
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Unable to complete payment",
      );
      setExportPaying(false);
    }
  };

  const handleAction = async () => {
    if (canDownloadExport(site.id, exportFormat)) {
      await downloadZip(exportFormat);
      return;
    }
    await processPurchase();
  };

  if (typeof document === "undefined") return null;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {createPortal(
        <div className="fixed inset-0 z-[10065] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close export dialog"
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
            onClick={close}
            disabled={busy}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,.3)]">
            <div className="border-b border-zinc-100 px-5 py-4 text-center">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-60"
                aria-label="Close"
              >
                <X size={16} />
              </button>
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Download size={20} />
              </span>
              <h2 className="mt-3 text-lg font-bold text-zinc-950">
                Export Website
              </h2>
              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                {siteTitle} — choose a format, pay once, then download up to{" "}
                {EXPORT_MAX_DOWNLOADS} times.
              </p>
            </div>

            <div className="space-y-2.5 px-5 py-4">
              {(Object.keys(EXPORT_PACKAGES) as ExportFormat[]).map((format) => {
                const pack = EXPORT_PACKAGES[format];
                const entitlement = getExportEntitlement(site.id, format);
                const remaining = entitlement?.downloadsRemaining ?? 0;
                const selected = exportFormat === format;
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setExportFormat(format)}
                    disabled={busy}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-100"
                        : "border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-zinc-300 bg-white text-transparent"
                      }`}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-900">
                          {pack.label}
                        </span>
                        <span className="text-sm font-bold text-zinc-950">
                          {formatExportPrice(format)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {pack.description}
                      </span>
                      {remaining > 0 ? (
                        <span className="mt-1.5 inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          {remaining} of {EXPORT_MAX_DOWNLOADS} downloads left
                        </span>
                      ) : entitlement ? (
                        <span className="mt-1.5 inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Downloads used — buy again
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}

              <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px] leading-4 text-zinc-500">
                After payment you can download this{" "}
                {exportFormat === "html" ? "HTML" : "Next.js"} package up to{" "}
                {EXPORT_MAX_DOWNLOADS} times for {siteTitle}.
              </p>

              {exportError ? (
                <p className="text-xs text-red-600 sm:text-sm">{exportError}</p>
              ) : null}
            </div>

            <div className="flex gap-2.5 border-t border-zinc-100 px-5 py-4">
              <button
                type="button"
                disabled={busy}
                onClick={close}
                className="h-10 flex-1 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleAction()}
                className="h-10 flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
              >
                {busy ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    {exportPaying ? "Paying..." : "Exporting..."}
                  </span>
                ) : selectedCanDownload ? (
                  `Download (${selectedEntitlement?.downloadsRemaining} left)`
                ) : (
                  `Pay ${formatInr(selectedPackage.priceInr)}`
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {exporting
        ? createPortal(
            <div
              className="fixed inset-0 z-[10070] flex items-center justify-center p-4"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px]" />
              <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/80 bg-white px-6 py-8 text-center shadow-[0_30px_90px_rgba(15,23,42,.28)]">
                <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Loader2 size={28} className="animate-spin" />
                </span>
                <div>
                  <p className="text-base font-semibold text-zinc-950">
                    Preparing{" "}
                    {exportFormat === "html" ? "HTML" : "Next.js"} export
                  </p>
                  <p className="mt-1.5 text-sm leading-5 text-zinc-500">
                    Packaging “{siteTitle}”…
                    <br />
                    Download will start automatically.
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
