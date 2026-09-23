"use client";

import type { RefObject } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  UserRound,
} from "lucide-react";
import UserAvatar from "@/components/auth/UserAvatar";
import type { DashboardTab } from "./sidebar";

type NavbarProps = {
  activeTab: DashboardTab;
  user: { name: string; email: string; avatar?: string | null };
  profileOpen: boolean;
  profileRef: RefObject<HTMLDivElement | null>;
  onMenuClick: () => void;
  onNavigate: (tab: DashboardTab) => void;
  onProfileToggle: () => void;
  onCreateWebsite: () => void;
  onLogout: () => void;
};

export default function Navbar({
  activeTab,
  user,
  profileOpen,
  profileRef,
  onMenuClick,
  onNavigate,
  onProfileToggle,
  onCreateWebsite,
  onLogout,
}: NavbarProps) {
  return (
    <header className="relative z-20 flex items-center gap-2 border-b border-zinc-200/80 bg-white/90 px-3 backdrop-blur-xl sm:gap-4 sm:px-5 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg hover:bg-zinc-100 md:hidden"
      >
        <Menu size={20} />
      </button>
      <h1 className="hidden min-w-fit text-base font-semibold sm:block 2xl:text-xl">
        {activeTab}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onCreateWebsite}
          className="hidden h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-medium text-white transition hover:bg-blue-700 sm:flex"
        >
          <Plus size={16} /> New website
        </button>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={onProfileToggle}
            aria-expanded={profileOpen}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-full px-1.5 hover:bg-zinc-100"
          >
            <UserAvatar
              name={user.name}
              email={user.email}
              avatarUrl={user.avatar}
              size={32}
              className="border-2 border-white shadow-sm"
            />
            <span className="hidden max-w-28 truncate text-xs font-medium lg:block">
              {user.name}
            </span>
            <ChevronDown className="hidden text-zinc-500 lg:block" size={15} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[52px] w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_20px_55px_rgba(39,32,56,0.16)]">
              <div className="flex items-center gap-3 px-2 py-2.5">
                <UserAvatar
                  name={user.name}
                  email={user.email}
                  avatarUrl={user.avatar}
                  size={40}
                />
                <span className="grid min-w-0">
                  <strong className="truncate text-xs">{user.name}</strong>
                  <small className="truncate text-[10px] text-zinc-500">
                    {user.email}
                  </small>
                </span>
              </div>
              <div className="my-1 h-px bg-zinc-100" />
              <button
                type="button"
                onClick={() => onNavigate("Profile")}
                className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              >
                <UserRound size={16} /> Profile
              </button>

              <div className="my-1 h-px bg-zinc-100" />
              <button
                type="button"
                onClick={onLogout}
                className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-xs text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
