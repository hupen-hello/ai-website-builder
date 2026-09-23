"use client";

import { ArrowUp, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useEffect, useState } from "react";
import {
  REDESIGN_CALL_HREF,
  REDESIGN_WHATSAPP_HREF,
} from "@/lib/redesign-floating-contact";

/** Reference-style floating actions injected into every redesign preview. */
export default function RedesignFloatingChrome() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const getScrollTop = () => {
      const scrolling = document.scrollingElement || document.documentElement;
      return scrolling?.scrollTop || window.scrollY || 0;
    };
    const onScroll = () => setShowTop(getScrollTop() > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const scrollTop = () => {
    const scrolling = document.scrollingElement || document.documentElement;
    if (scrolling) scrolling.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll<HTMLElement>(".redesign-template-scrollbars, [data-redesign-flat-site]").forEach((el) => {
      el.scrollTo?.({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <>
      <div
        data-redesign-float="left"
        className="pointer-events-none fixed bottom-5 left-4 z-[9990] flex flex-col gap-3 md:bottom-6 md:left-6"
      >
        <a
          href={REDESIGN_WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_12px_32px_rgba(16,185,129,0.35)] transition hover:-translate-y-0.5 hover:bg-emerald-600"
        >
          <FaWhatsapp size={22} />
        </a>
        <a
          href={REDESIGN_CALL_HREF}
          aria-label="Call"
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_32px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          <Phone size={20} />
        </a>
      </div>

      <div
        data-redesign-float="right"
        className="pointer-events-none fixed bottom-5 right-4 z-[9990] flex flex-col items-end gap-3 md:bottom-6 md:right-6"
      >
        <button
          type="button"
          aria-label="Back to top"
          onClick={scrollTop}
          className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_12px_32px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5 hover:bg-orange-600 ${
            showTop ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <ArrowUp size={22} />
        </button>
      </div>
    </>
  );
}
