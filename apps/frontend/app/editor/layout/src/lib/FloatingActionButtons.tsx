"use client";

import {
  ArrowUp,
  ChevronUp,
  ChevronsUp,
  CircleArrowUp,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  getActiveFloatingItems,
  type FloatingItemData,
  type FloatingItemIcon,
} from "./floatingItems";
import { getPublishedSiteBasePath, resolvePublishedPageHref } from "./sectionScroll";

const FloatingIcon = ({
  icon,
  size = 21,
}: {
  icon: FloatingItemIcon;
  size?: number;
}) => {
  if (icon === "whatsapp") {
    return <FaWhatsapp size={size + 3} aria-hidden="true" />;
  }
  if (icon === "phone") return <Phone size={size} />;
  if (icon === "arrow-up") return <ArrowUp size={size + 1} />;
  if (icon === "chevron-up") return <ChevronUp size={size + 2} />;
  if (icon === "chevrons-up") return <ChevronsUp size={size + 1} />;
  if (icon === "circle-arrow-up") return <CircleArrowUp size={size + 1} />;
  if (icon === "mail") return <Mail size={size} />;
  if (icon === "message") return <MessageCircle size={size} />;
  return <ExternalLink size={size} />;
};

const floatingButtonClass = (item: FloatingItemData) => {
  if (item.icon === "whatsapp" || item.id === "whatsapp") {
    return "flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_12px_32px_rgba(16,185,129,0.32)] transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-600";
  }
  if (item.icon === "phone" || item.id === "call") {
    return "flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_32px_rgba(37,99,235,0.32)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700";
  }
  if (item.id === "backToTop" || item.icon === "arrow-up") {
    return "flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_12px_32px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800";
  }
  return "flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_12px_32px_rgba(15,23,42,0.24)] transition-all duration-300 hover:-translate-y-1 hover:bg-slate-700";
};

export function FloatingActionButtons({
  footerData,
  onBackToTop,
  leftClassName = "fixed bottom-5 left-5 z-[9000] flex flex-col gap-3 md:left-[var(--template-floating-left,1.25rem)]",
  rightClassName = "fixed bottom-5 right-5 z-[9000] flex flex-col gap-3",
}: {
  footerData?: {
    floatingItems?: unknown;
    whatsappLink?: string;
    callLink?: string;
  } | null;
  onBackToTop: () => void;
  leftClassName?: string;
  rightClassName?: string;
}) {
  const items = getActiveFloatingItems(footerData);
  const leftItems = items.filter((item) => item.side !== "right");
  const rightItems = items.filter((item) => item.side === "right");

  const renderItem = (item: FloatingItemData) => {
    const className = floatingButtonClass(item);
    const label = item.label || item.id;

    if (item.id === "backToTop") {
      return (
        <button
          key={item.id}
          type="button"
          onClick={onBackToTop}
          className={className}
          aria-label={label}
          title={label}
          data-back-to-top="true"
        >
          <FloatingIcon icon={item.icon} />
        </button>
      );
    }

    if (!item.href?.trim()) return null;

    const href = resolvePublishedPageHref(
      item.href,
      typeof window !== "undefined" ? getPublishedSiteBasePath() : undefined,
    );

    return (
      <a
        key={item.id}
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className={className}
        aria-label={label}
        title={label}
      >
        <FloatingIcon icon={item.icon} />
      </a>
    );
  };

  return (
    <>
      {leftItems.length > 0 ? (
        <div className={leftClassName}>{leftItems.map(renderItem)}</div>
      ) : null}
      {rightItems.length > 0 ? (
        <div className={rightClassName}>{rightItems.map(renderItem)}</div>
      ) : null}
    </>
  );
}
