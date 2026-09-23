"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Building2,
  CheckCircle2,
  Mail,
  MessageSquareText,
  Phone,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type GetQuoteEnquiryModalProps = {
  open: boolean;
  onClose: () => void;
};

type EnquiryForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

const emptyForm: EnquiryForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  message: "",
};

const subscribeToClientMount = () => () => {};

const fieldShellClass =
  "group relative flex items-center rounded-xl border border-slate-200/90 bg-slate-50/80 transition focus-within:border-[#173fdb]/45 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(23,63,219,0.08)]";

const inputClass =
  "h-12 w-full rounded-xl bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400";

export default function GetQuoteEnquiryModal({
  open,
  onClose,
}: GetQuoteEnquiryModalProps) {
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    () => true,
    () => false,
  );
  const [form, setForm] = useState<EnquiryForm>(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSubmitted(false);
    setForm(emptyForm);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const updateField =
    (field: keyof EnquiryForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Unable to send enquiry");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send enquiry");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-enquiry-title"
    >
      <button
        type="button"
        aria-label="Close enquiry dialog"
        className="absolute inset-0 bg-[#08132f]/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[580px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_32px_100px_rgba(8,19,47,0.42)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#173fdb] via-[#1b47e8] to-[#08132f] px-6 pb-8 pt-8 text-center sm:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 left-6 size-36 rounded-full bg-[#b9ff66]/12 blur-3xl"
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="relative mx-auto mb-5 flex justify-center">
            <Image
              src="/lestow-logo.svg"
              alt="Lestow AI Website Builder"
              width={146}
              height={46}
              priority
              className="h-11 w-[146px] brightness-0 invert"
            />
          </div>

          <div className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
            <Sparkles size={13} className="text-[#b9ff66]" />
            Custom project quote
          </div>

          <h2
            id="quote-enquiry-title"
            className="relative mt-4 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[32px]"
          >
            {submitted ? "Enquiry sent" : "Get a quote"}
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-white/75">
            {submitted
              ? "Thanks for reaching out. Our team will review your request and get back to you shortly."
              : "Share a few details about your project and we'll send you a tailored quote."}
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-7">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/70">
                <CheckCircle2 size={32} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#08132f] text-sm font-semibold text-white transition hover:bg-[#173fdb]"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-left">
                  <span className="text-xs font-semibold text-slate-600">
                    Full name
                  </span>
                  <div className={fieldShellClass}>
                    <UserRound
                      size={16}
                      className="ml-3 shrink-0 text-slate-400 group-focus-within:text-[#173fdb]"
                    />
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={updateField("name")}
                      placeholder="Your name"
                      className={`${inputClass} pl-2 pr-3`}
                    />
                  </div>
                </label>

                <label className="grid gap-1.5 text-left">
                  <span className="text-xs font-semibold text-slate-600">
                    Email address
                  </span>
                  <div className={fieldShellClass}>
                    <Mail
                      size={16}
                      className="ml-3 shrink-0 text-slate-400 group-focus-within:text-[#173fdb]"
                    />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={updateField("email")}
                      placeholder="you@company.com"
                      className={`${inputClass} pl-2 pr-3`}
                    />
                  </div>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-left">
                  <span className="text-xs font-semibold text-slate-600">
                    Phone number
                  </span>
                  <div className={fieldShellClass}>
                    <Phone
                      size={16}
                      className="ml-3 shrink-0 text-slate-400 group-focus-within:text-[#173fdb]"
                    />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={updateField("phone")}
                      placeholder="+91 98765 43210"
                      className={`${inputClass} pl-2 pr-3`}
                    />
                  </div>
                </label>

                <label className="grid gap-1.5 text-left">
                  <span className="text-xs font-semibold text-slate-600">
                    Business name
                    <span className="ml-1 font-normal text-slate-400">
                      (optional)
                    </span>
                  </span>
                  <div className={fieldShellClass}>
                    <Building2
                      size={16}
                      className="ml-3 shrink-0 text-slate-400 group-focus-within:text-[#173fdb]"
                    />
                    <input
                      type="text"
                      value={form.company}
                      onChange={updateField("company")}
                      placeholder="Company or brand"
                      className={`${inputClass} pl-2 pr-3`}
                    />
                  </div>
                </label>
              </div>

              <label className="grid gap-1.5 text-left">
                <span className="text-xs font-semibold text-slate-600">
                  Project details
                </span>
                <div className={`${fieldShellClass} items-start`}>
                  <MessageSquareText
                    size={16}
                    className="ml-3 mt-3.5 shrink-0 text-slate-400 group-focus-within:text-[#173fdb]"
                  />
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={updateField("message")}
                    placeholder="Tell us about your website goals, timeline, and anything else we should know..."
                    className="min-h-[112px] w-full resize-none rounded-xl bg-transparent px-2 py-3 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              {error ? (
                <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#08132f] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(8,19,47,0.18)] transition hover:-translate-y-0.5 hover:bg-[#173fdb] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Sending enquiry..." : "Send enquiry"}
              </button>

              <p className="text-center text-[11px] leading-5 text-slate-400">
                We usually respond within one business day.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
