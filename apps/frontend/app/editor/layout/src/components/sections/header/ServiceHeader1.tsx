'use client';
import type { SectionProps } from "../../../types/section";
import React, { useState } from 'react';
import { ApplianceLink as Link } from "../../../lib/applianceLink";
import { useAppliancePathname as usePathname } from "../../../lib/applianceLink";
import { HeaderData } from "../../../lib/applianceTypes";
import { FaArrowRight, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';
import { FiPhoneCall } from 'react-icons/fi';

export const Header = ({ data }: { data?: HeaderData }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  if (!data) return null;

  const navLinks = [...(data.navLinksLeft || []), ...(data.navLinksRight || [])];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="w-full flex min-h-[80px] lg:min-h-[100px] items-stretch">
        
        {/* Left Dark Area for Logo */}
        <div className="flex w-[280px] shrink-0 items-center justify-center bg-[var(--color-primary)] px-4 sm:w-[320px] lg:w-[32%] xl:w-[28%] lg:[clip-path:polygon(0_0,calc(100%-60px)_0,100%_100%,0%_100%)] [clip-path:polygon(0_0,calc(100%-30px)_0,100%_100%,0%_100%)]">
          <div className="flex w-full justify-center lg:justify-end lg:pr-12 xl:pr-16">
            <Link href="/" className="flex items-center shrink-0">
              <img src={data.logo} alt={data.logoAlt || 'Logo'} className="h-14 sm:h-16 lg:h-24 object-contain" />
            </Link>
          </div>
        </div>

        {/* Right Area for Nav and Button */}
        <div className="flex min-w-0 flex-1 items-center justify-between pr-4 lg:pr-8 xl:pr-16 pl-4 lg:pl-8">
          
          {/* Mobile Menu Toggle */}
          <div className="flex flex-1 justify-end lg:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="flex h-10 w-10 items-center justify-center rounded-md text-2xl text-[var(--color-primary)]"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-start flex-1 gap-6 xl:gap-10">
            {navLinks.map((link) => {
              const hasDropdown = link.subLinks && link.subLinks.length > 0;
              return (
                <div key={link.id} className="relative group/nav py-6">
                  {hasDropdown ? (
                    <div 
                      className={`relative flex items-center gap-1.5 py-1 text-[15px] font-bold tracking-wide transition-colors cursor-default ${
                        pathname === link.url || (link.subLinks && link.subLinks.some(sub => pathname === sub.url))
                          ? 'text-[var(--color-accent)] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-[var(--color-accent)]' 
                          : 'text-[var(--color-primary)] hover:text-[var(--color-accent)]'
                      }`}
                    >
                      {link.label}
                      <FaChevronDown className="text-[10px] transition-transform duration-300 group-hover/nav:rotate-180" />
                    </div>
                  ) : (
                    <Link 
                      href={link.url} 
                      className={`relative flex items-center gap-1.5 py-1 text-[15px] font-bold tracking-wide transition-colors ${
                        pathname === link.url 
                          ? 'text-[var(--color-accent)] after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-[var(--color-accent)]' 
                          : 'text-[var(--color-primary)] hover:text-[var(--color-accent)]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {hasDropdown && (
                    <div className="absolute top-full left-0 mt-0 w-[220px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-b-lg border-t-[3px] border-[var(--color-accent)] opacity-0 invisible translate-y-4 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-300 z-50">
                      <ul className="flex flex-col py-2">
                        {link.subLinks!.map((subLink) => (
                          <li key={subLink.id}>
                            <Link 
                              href={subLink.url}
                              className={`block px-5 py-2.5 text-[14px] font-medium transition-colors hover:bg-gray-50 hover:text-[var(--color-accent)] ${
                                pathname === subLink.url ? 'text-[var(--color-accent)] bg-gray-50' : 'text-gray-700'
                              }`}
                            >
                              {subLink.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Contact Button */}
          <div className="hidden lg:block shrink-0">
            {data.contactButton && (
              <Link 
                href={data.contactButton.url} 
                className="flex items-center justify-center gap-3 bg-[var(--color-accent)] pl-2 pr-5 py-2 rounded-full text-[15px] font-bold text-white transition-all hover:brightness-95 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-accent)]">
                  <FiPhoneCall className="text-[16px]" />
                </span>
                {data.contactButton.text}
                <FaArrowRight className="text-[12px] ml-1" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute left-0 top-full flex max-h-[calc(100vh-80px)] w-full flex-col overflow-y-auto border-t border-gray-100 bg-white p-4 shadow-xl lg:hidden">
          {navLinks.map((link) => {
            const hasSubLinks = link.subLinks && link.subLinks.length > 0;
            return (
              <div key={link.id} className="flex flex-col border-b border-gray-50">
                {hasSubLinks ? (
                  <div 
                    onClick={() => setOpenDropdowns(prev => ({ ...prev, [link.id]: !prev[link.id] }))}
                    className={`flex items-center justify-between px-2 py-3 text-[15px] font-bold tracking-wide cursor-pointer ${
                      pathname === link.url || link.subLinks!.some(sub => pathname === sub.url) ? 'text-[var(--color-accent)]' : 'text-[var(--color-primary)]'
                    }`}
                  >
                    {link.label}
                    <FaChevronDown className={`text-[12px] transition-transform duration-300 ${openDropdowns[link.id] ? 'rotate-180' : ''}`} />
                  </div>
                ) : (
                  <Link 
                    href={link.url} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={`px-2 py-3 text-[15px] font-bold tracking-wide ${
                      pathname === link.url ? 'text-[var(--color-accent)]' : 'text-[var(--color-primary)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
                
                {hasSubLinks && (
                  <div className={`flex flex-col pl-6 overflow-hidden transition-all duration-300 ${openDropdowns[link.id] ? 'max-h-[500px] pb-2' : 'max-h-0'}`}>
                    {link.subLinks!.map(sub => (
                      <Link
                        key={sub.id}
                        href={sub.url}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`py-2 text-[14px] font-medium ${
                          pathname === sub.url ? 'text-[var(--color-accent)]' : 'text-gray-600'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {data.contactButton && (
            <Link 
              href={data.contactButton.url} 
              onClick={() => setMobileMenuOpen(false)} 
              className="mt-6 flex items-center justify-center gap-3 rounded-full bg-[var(--color-accent)] px-6 py-3 text-[15px] font-bold text-white"
            >
              <FiPhoneCall className="text-lg" />
              {data.contactButton.text}
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default function ServiceHeader1({ data = {} }: SectionProps) {
  return <Header data={data as never} />;
}

