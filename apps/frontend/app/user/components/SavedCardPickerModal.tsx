"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, Loader2, X } from "lucide-react";
import type { SavedPaymentMethod } from "@/lib/razorpayCheckout";

type SavedCardPickerModalProps = {
  open: boolean;
  loading?: boolean;
  amountLabel: string;
  methods: SavedPaymentMethod[];
  onPayWithCard: (method: SavedPaymentMethod, cvv: string) => void;
  onUseOtherMethod: () => void;
  onClose: () => void;
};

export default function SavedCardPickerModal({
  open,
  loading = false,
  amountLabel,
  methods,
  onPayWithCard,
  onUseOtherMethod,
  onClose,
}: SavedCardPickerModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<SavedPaymentMethod | null>(
    null,
  );
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
      setCvv("");
    }
  }, [open]);

  if (!open) return null;

  const handlePay = () => {
    if (!selectedMethod || cvv.trim().length < 3) return;
    onPayWithCard(selectedMethod, cvv.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-card-picker-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2
              id="saved-card-picker-title"
              className="text-base font-semibold text-zinc-950"
            >
              Pay with saved card
            </h2>
            <p className="mt-1 text-[12px] text-zinc-500">{amountLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {selectedMethod ? (
          <div className="space-y-4 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setSelectedMethod(null);
                setCvv("");
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-800 disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Choose another card
            </button>

            <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-blue-700 shadow-sm">
                <CreditCard size={18} />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-zinc-900">
                  {selectedMethod.brand} •••• {selectedMethod.ending}
                </span>
                <span className="block text-[11px] text-zinc-500">
                  Expires {selectedMethod.expires}
                </span>
              </span>
            </div>

            <div>
              <label
                htmlFor="saved-card-cvv"
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.12em] text-zinc-500"
              >
                Enter CVV
              </label>
              <input
                id="saved-card-cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                value={cvv}
                onChange={(event) =>
                  setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="123"
                disabled={loading}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm tracking-[0.3em] text-zinc-900 outline-none transition focus:border-blue-400 disabled:opacity-60"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">
                3-digit code on the back of your card. OTP may be required next.
              </p>
            </div>

            <button
              type="button"
              disabled={loading || cvv.trim().length < 3}
              onClick={handlePay}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-[13px] font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay now"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2 px-5 py-4">
            {methods.map((method) => (
              <button
                key={method.id}
                type="button"
                disabled={loading}
                onClick={() => setSelectedMethod(method)}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-blue-700 shadow-sm">
                  <CreditCard size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-zinc-900">
                    {method.brand} •••• {method.ending}
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    Expires {method.expires}
                    {method.role === "Default" ? " · Default" : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-zinc-100 px-5 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onUseOtherMethod}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-[12px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            UPI, new card, or other methods
          </button>
        </div>
      </div>
    </div>
  );
}
