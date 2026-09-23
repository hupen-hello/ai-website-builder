"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  CloudUpload,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  RotateCw,
  UserRound,
} from "lucide-react";

type NavbarProps = {
  isDark: boolean;
  hasUnsavedChanges: boolean;
  userEmail: string | null;
  hideActions?: boolean;
  onPrimaryAction: () => void;
  onLogout: () => void;
};

const EDITOR_MENU_EVENT = "redesign-editor-menu";

export default function Navbar({
  isDark,
  hasUnsavedChanges,
  userEmail,
  hideActions = false,
  onPrimaryAction,
  onLogout,
}: NavbarProps) {
  const params = useParams();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";
  const previewHref = designId
    ? `/redesign/${designId}/preview`
    : "/redesign/template";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const closeOnOutside = (event: Event) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    const frameDocument = document.querySelector<HTMLIFrameElement>("iframe[data-preview-breakpoint]")?.contentDocument;
    frameDocument?.addEventListener("mousedown", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      frameDocument?.removeEventListener("mousedown", closeOnOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    const closeIfOtherMenu = (event: Event) => {
      const menu = (event as CustomEvent<string>).detail;
      if (menu !== "user") setIsUserMenuOpen(false);
    };
    window.addEventListener(EDITOR_MENU_EVENT, closeIfOtherMenu);
    return () => window.removeEventListener(EDITOR_MENU_EVENT, closeIfOtherMenu);
  }, []);

  if (!userEmail && isUserMenuOpen) {
    setIsUserMenuOpen(false);
  }

  return (
    <header className={`relative z-50 flex h-[52px] shrink-0 items-center justify-between border-b px-3 text-sm shadow-lg transition-colors ${isDark ? "border-white/10 bg-[#222222]" : "border-slate-200 bg-white"}`}>
      <div className="flex h-full items-center gap-2">
        <Link
          href="/"
          aria-label="Lestow home"
          className="flex h-8 items-center rounded-lg px-2 transition hover:bg-white/5"
        >
          <Image src="/lestow-logo.svg" alt="Lestow" width={116} height={36} priority className={`h-8 w-auto ${isDark ? "brightness-0 invert" : ""}`} />
        </Link>
      </div>

      {!hideActions && (
      <div className="flex items-center gap-2">
        {/* <button className="hidden h-8 items-center gap-2 rounded-lg border border-white/10 px-3 font-medium text-slate-300 transition hover:bg-white/10 sm:flex">
          <CircleHelp size={16} />
          <span className="text-[15px] translate-y-px leading-0">Heldp</span>
        </button> */}
        <button
          onClick={() => window.location.reload()}
          aria-label="Reload editor"
          className="flex h-8 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <RotateCw size={16} />
        </button>
        <a
          href={previewHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Open preview in browser"
          title="Open preview in browser"
          className="flex h-8 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <ExternalLink size={16} />
        </a>
        <button
          type="button"
          onClick={onPrimaryAction}
          className="flex h-8 items-center gap-1 rounded-lg bg-blue-500 px-2 font-semibold text-white transition hover:bg-blue-600"
        >
          <CloudUpload size={16} />
          <span className="text-[15px] translate-y-px leading-0">
            {hasUnsavedChanges ? "Save" : "Export"}
          </span>
        </button>
        {userEmail && (
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              aria-label="Open account menu"
              aria-expanded={isUserMenuOpen}
              onClick={() => {
                setIsUserMenuOpen((open) => {
                  const next = !open;
                  if (next) window.dispatchEvent(new CustomEvent(EDITOR_MENU_EVENT, { detail: "user" }));
                  return next;
                });
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${isDark
                ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              <UserRound size={16} />
            </button>
            {isUserMenuOpen && (
              <div
                className={`absolute right-0 top-10 z-[80] w-44 overflow-hidden rounded-xl border py-1 shadow-2xl ${isDark
                  ? "border-white/10 bg-[#1b1d21] text-white"
                  : "border-slate-200 bg-white text-slate-900"
                  }`}
              >
                <Link
                  href="/dashboard"
                  className={`flex h-9 items-center gap-2.5 px-3 text-sm transition ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                    }`}
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className={`flex h-9 w-full items-center gap-2.5 px-3 text-sm transition ${isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
                    }`}
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </header>
  );
}
