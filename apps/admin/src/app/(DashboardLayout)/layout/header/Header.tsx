"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import Profile from "./Profile";
import Link from "next/link";
import Notifications from "./Notifications";
import SidebarLayout from "../sidebar/Sidebar";
import FullLogo from "../shared/logo/FullLogo";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);


  return (
    <>
      <header
        className={`sticky top-0 left-10 z-30 w-full transition-all duration-300 border-b border-gray-200 dark:border-white/10 ${
          isSticky
            ? "bg-white/90 dark:bg-[#0b0b0b]/80 backdrop-blur-xl shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-white/50 dark:bg-transparent backdrop-blur-md"
        }`}
      >
        <nav className="rounded-none py-4 sm:ps-5 max-w-full sm:pe-10 flex justify-between items-center px-6">
          <div
            onClick={() => setIsOpen(true)}
            className="xl:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex justify-center items-center cursor-pointer transition-colors"
          >
            <Icon icon="tabler:menu-2" height={24} width={24} />
          </div>

          <div className="block xl:hidden w-[140px] sm:w-[160px] flex-shrink-0 origin-left">
            <FullLogo />
          </div>

          <div className="hidden xl:flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="relative w-[320px] group">
                <Icon
                  icon="solar:magnifer-linear"
                  width={18}
                  height={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-[#e53935] transition-colors"
                />
                <Input
                  type="text"
                  placeholder="Global Search..."
                  className="h-[42px] w-full bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-white/5 text-[13.5px] text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-full pl-11 pr-4 focus-visible:ring-1 focus-visible:ring-[#e53935]/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex w-full justify-end items-center">
              <div className="flex items-center gap-4">

                <div className="flex items-center justify-center relative bg-gray-100 dark:bg-[#171717] border border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full w-[40px] h-[40px] transition-all shadow-sm">
                  <Notifications />
                </div>

                <div className="w-[1px] h-6 bg-gray-300 dark:bg-white/10 mx-1"></div>

                <div className="pl-2">
                  <Profile />
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <SheetTitle>sidebar</SheetTitle>
          </VisuallyHidden>
          <SidebarLayout
            onClose={() => setIsOpen(false)}
            isCollapsed={false}
            setIsCollapsed={() => {}}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Header;
