"use client";

import { Suspense, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { PreviewProvider } from "./layout/src/components/context/PreviewContext";
import { generalSansMedium } from "@/app/fonts";
import EditorLoadingScreen from "./components/EditorLoadingScreen";

type CloudSaveDetail = {
  status: "saving" | "saved" | "error";
  message: string;
};

function EditorCloudSaveToast() {
  const [toast, setToast] = useState<CloudSaveDetail | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<CloudSaveDetail>).detail;
      if (!detail?.status || !detail.message) return;
      setToast(detail);
    };

    window.addEventListener("ai-builder-cloud-save", handleToast);
    return () => {
      window.removeEventListener("ai-builder-cloud-save", handleToast);
    };
  }, []);

  useEffect(() => {
    if (!toast || toast.status === "saving") return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!toast) return null;

  const styles =
    toast.status === "error"
      ? "border-red-200 bg-white text-red-700"
      : toast.status === "saving"
        ? "border-slate-200 bg-white text-slate-700"
        : "border-emerald-200 bg-white text-emerald-700";

  return (
    <div
      className={`fixed right-4 top-20 z-[10060] flex max-w-[min(92vw,320px)] items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-[0_12px_35px_rgba(15,23,42,0.16)] ${styles}`}
      role="status"
      aria-live="polite"
    >
      {toast.status === "saving" ? (
        <Loader2 size={16} className="shrink-0 animate-spin" />
      ) : toast.status === "error" ? (
        <X size={16} className="shrink-0" />
      ) : (
        <Check size={16} className="shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<EditorLoadingScreen message="Loading editor…" />}>
      <PreviewProvider>
        <div className={generalSansMedium.className}>
          {children}
          <EditorCloudSaveToast />
        </div>
      </PreviewProvider>
    </Suspense>
  );
}
