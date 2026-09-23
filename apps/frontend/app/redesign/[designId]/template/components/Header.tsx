'use client';

import { useEffect, useRef, useState } from 'react';
import {
    ChevronDown,
    Search,
    Grid,
    Menu,
    X,
} from 'lucide-react';
import { useBuiltSiteSections, useBuiltSiteTheme } from './BuiltSiteProvider';
import AiSectionHtml from './AiSectionHtml';

export default function Header() {
    const theme = useBuiltSiteTheme();
    const sections = useBuiltSiteSections();
    const brandName = theme?.brandName || 'ATLASSIAN';
    const brandInitial = brandName.charAt(0).toUpperCase();
    const logoImage = theme?.logoImage?.trim() || '';
    const primaryColor = theme?.primaryColor || '#0052CC';
    const accentColor = theme?.accentColor || '#D9381E';
    const isDarkHeader = theme?.headerStyle === 'dark';
    const navItems = theme?.navItems || ['Products', 'Solutions', 'Why Atlassian', 'Resources', 'Enterprise'];
    const profileName = theme?.brandName.split(" ")[0] || "Muneeb";
    const mutedText = isDarkHeader ? 'text-white/90' : 'text-slate-700';
    const iconButton = isDarkHeader ? 'text-white/80 hover:bg-white/10' : 'text-slate-700 hover:bg-gray-100';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!mobileMenuOpen) return;

        const closeOnOutside = (event: MouseEvent) => {
            if (!headerRef.current?.contains(event.target as Node)) setMobileMenuOpen(false);
        };
        const closeOnResize = () => {
            if (window.matchMedia("(min-width: 640px)").matches) setMobileMenuOpen(false);
        };

        document.addEventListener("mousedown", closeOnOutside);
        window.addEventListener("resize", closeOnResize);
        return () => {
            document.removeEventListener("mousedown", closeOnOutside);
            window.removeEventListener("resize", closeOnResize);
        };
    }, [mobileMenuOpen]);

    const navButtons = navItems.map((item) => (
        <button key={item} type="button" className={`flex shrink-0 items-center gap-1 transition-colors hover:opacity-80 ${mutedText}`}>
            <span>{item}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 stroke-[2.5] sm:h-4 sm:w-4" />
        </button>
    ));

    const logo = (
        <a href="#" className="flex min-w-0 shrink-0 items-center gap-2 font-bold tracking-tight" style={{ color: primaryColor }}>
            {logoImage ? (
                <img src={logoImage} alt={brandName} className="h-8 w-auto max-w-[140px] object-contain" />
            ) : theme ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: primaryColor }}>
                    {brandInitial}
                </span>
            ) : (
                <svg className="h-6 w-6 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M6.3 16.5L12 3l5.7 13.5H6.3z" />
                </svg>
            )}
            <span className="max-w-[9.5rem] truncate text-base font-black tracking-wider sm:max-w-[12rem] sm:text-xl md:max-w-[16rem]">
                {brandName.toUpperCase()}
            </span>
        </a>
    );

    const profile = (
        <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: accentColor }}>
                {brandInitial}
            </div>
            <span className={`hidden text-sm font-semibold lg:block ${isDarkHeader ? 'text-white' : 'text-slate-800'}`}>
                {profileName}
            </span>
        </div>
    );

    return (
      <AiSectionHtml
        html={sections?.header}
        fallback={
        <header
            ref={headerRef}
            className={`relative isolate w-full border-b px-3 py-3 sm:px-4 md:px-8 ${isDarkHeader ? 'border-white/10 bg-[#101214] text-white' : 'border-gray-200 bg-white text-slate-800'}`}
            style={{ fontFamily: theme?.fontFamily }}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5 lg:gap-8">
                    {logo}

                    <nav className="hidden min-w-0 flex-1 flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap text-sm font-medium [scrollbar-width:none] [-ms-overflow-style:none] sm:flex md:gap-5 lg:gap-6 [&::-webkit-scrollbar]:hidden">
                        {navButtons}
                    </nav>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
                    <div className="relative hidden items-center lg:flex">
                        <input
                            type="text"
                            placeholder="Search"
                            className={`w-36 rounded-full py-1.5 pl-4 pr-9 text-sm outline-none transition-all duration-200 focus:w-48 focus:ring-2 focus:ring-blue-500 ${
                                isDarkHeader
                                    ? 'bg-white/10 text-white placeholder:text-white/50 focus:bg-white/15'
                                    : 'bg-gray-100/80 text-slate-800 hover:bg-gray-200/60 focus:bg-white'
                            }`}
                        />
                        <Search className={`pointer-events-none absolute right-3 h-4 w-4 ${isDarkHeader ? 'text-white/70' : 'text-slate-600'}`} />
                    </div>

                    <div className={`hidden h-6 w-px lg:block ${isDarkHeader ? 'bg-white/20' : 'bg-gray-300'}`} />

                    <button type="button" className={`hidden rounded-md p-1.5 transition-colors md:block ${iconButton}`}>
                        <Grid className="h-5 w-5" />
                    </button>

                    {profile}

                    <button
                        type="button"
                        data-redesign-ui="true"
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileMenuOpen}
                        className={`rounded-md p-2 transition-colors sm:hidden ${iconButton}`}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setMobileMenuOpen((open) => !open);
                        }}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div
                    data-redesign-ui="true"
                    className="absolute inset-x-0 top-full z-[120] isolate border-b border-slate-200 bg-white px-3 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)] sm:hidden"
                    style={{ backgroundColor: "#ffffff" }}
                >
                    <nav className="flex flex-col gap-1 bg-white text-sm font-medium">
                        {navItems.map((item) => (
                            <button
                                key={item}
                                type="button"
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-slate-700 transition-colors hover:bg-slate-100"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span>{item}</span>
                                <ChevronDown className="h-4 w-4 shrink-0 stroke-[2.5]" />
                            </button>
                        ))}
                    </nav>
                </div>
            )}
        </header>
        }
      />
    );
}
