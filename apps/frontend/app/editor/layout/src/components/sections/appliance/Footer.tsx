'use client';
import React, { useEffect, useState } from 'react';
import { FooterData } from './applianceTypes';
import { ApplianceLink as Link } from "./ApplianceLink";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaChevronRight, FaArrowUp } from 'react-icons/fa';

const renderSocialIcon = (iconName: string) => {
  switch (iconName) {
    case 'FaFacebookF': return <FaFacebookF />;
    case 'FaInstagram': return <FaInstagram />;
    case 'FaLinkedinIn': return <FaLinkedinIn />;
    case 'FaYoutube': return <FaYoutube />;
    default: return null;
  }
};

export const Footer = ({ data }: { data?: FooterData }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!data) return null;

  return (
    <footer className="w-full relative bg-[#02183b] text-white">
      
      {/* Main Content Area */}
      <div className="pt-16 pb-12">
        <div className="max-w-[1400px] mx-auto px-4 xl:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_1fr_1fr_1.4fr] gap-6 xl:gap-8">
            
            {/* Column 1: Brand & Social */}
            <div className="lg:pr-4 flex flex-col">
              <Link href="/">
                <img src="/main logo/logo2.webp" alt={data.logoAlt} className="h-16 w-auto object-contain object-left mb-6" />
              </Link>
              <p className="text-gray-300 text-[13px] leading-relaxed mb-6">
                {data.description}
              </p>
              <div className="flex items-center gap-2 mb-8">
                {data.socialLinks.map(social => (
                  <Link 
                    key={social.id} 
                    href={social.url} 
                    className="w-8 h-8 rounded-full bg-[#0a356e] flex items-center justify-center text-white hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-md text-xs"
                  >
                    {renderSocialIcon(social.icon)}
                  </Link>
                ))}
              </div>
              {/* Satisfaction Box */}
              <div className="border-t border-[#1a3869] pt-6 flex items-start gap-4 mt-auto">
                <div className="text-[var(--color-accent)] text-3xl shrink-0">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                </div>
                <div>
                  <h5 className="font-bold text-white text-[14px] leading-tight whitespace-nowrap">{data.satisfactionTitle}</h5>
                  <p className="text-gray-400 text-[12px] mt-1 leading-tight">{data.satisfactionDesc}</p>
                </div>
              </div>
            </div>

            {/* Column 2: {data.quickLinksTitle} */}
            <div className="lg:border-l lg:border-[#1a3869] lg:pl-6">
              <h3 className="text-[18px] font-bold text-white mb-6 flex flex-col">
                Quick Links
                <span className="w-8 h-[3px] bg-[var(--color-accent)] mt-3"></span>
              </h3>
              <ul className="flex flex-col gap-3.5">
                {data.quickLinks.map(link => (
                  <li key={link.id}>
                    <Link href={link.url} className="text-gray-300 text-[13px] hover:text-[var(--color-accent)] transition-colors flex items-center gap-3">
                      <FaChevronRight className="text-[var(--color-accent)] text-[10px]" /> {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: {data.getInTouchTitle} */}
            <div className="lg:border-l lg:border-[#1a3869] lg:pl-6">
              <h3 className="text-[18px] font-bold text-white mb-6 flex flex-col">
                Get In Touch
                <span className="w-8 h-[3px] bg-[var(--color-accent)] mt-3"></span>
              </h3>
              <ul className="flex flex-col gap-5">
                <li className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0a356e] flex items-center justify-center text-[var(--color-accent)] shrink-0 text-[12px]">
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-[13px]">{data.contactInfo.phone}</h5>
                    <p className="text-gray-400 text-[12px]">{data.callNowText}</p>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0a356e] flex items-center justify-center text-[var(--color-accent)] shrink-0 text-[12px]">
                    <FaEnvelope />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-[13px]">{data.contactInfo.email}</h5>
                    <p className="text-gray-400 text-[12px]">{data.emailReplyText}</p>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0a356e] flex items-center justify-center text-[var(--color-accent)] shrink-0 text-[12px]">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="text-white text-[13px] leading-snug">{data.contactInfo.address}</p>
                  </div>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#0a356e] flex items-center justify-center text-[var(--color-accent)] shrink-0 text-[12px]">
                    <FaClock />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-[13px]">{data.hoursDays}</h5>
                    <p className="text-gray-400 text-[12px]">{data.hours.replace('\n', ' ')}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: {data.servicesTitle} */}
            <div className="lg:border-l lg:border-[#1a3869] lg:pl-6">
              <h3 className="text-[18px] font-bold text-white mb-6 flex flex-col">
                Our Services
                <span className="w-8 h-[3px] bg-[var(--color-accent)] mt-3"></span>
              </h3>
              <ul className="flex flex-col gap-3.5">
                {data.servicesLinks.map((link, i) => {
                  const icons = [
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="text-[var(--color-accent)] w-[16px] h-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="text-[var(--color-accent)] w-[16px] h-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>,
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="text-[var(--color-accent)] w-[16px] h-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>,
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="text-[var(--color-accent)] w-[16px] h-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="text-[var(--color-accent)] w-[16px] h-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>,
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="text-[var(--color-accent)] w-[16px] h-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  ];
                  return (
                    <li key={link.id}>
                      <Link href={link.url} className="text-gray-300 text-[13px] hover:text-[var(--color-accent)] transition-colors flex items-center gap-3">
                        {icons[i % icons.length]} {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Column 5: {data.stayConnectedTitle} */}
            <div className="lg:border-l lg:border-[#1a3869] lg:pl-6">
              <h3 className="text-[18px] font-bold text-white mb-6 flex flex-col">
                Stay Connected
                <span className="w-8 h-[3px] bg-[var(--color-accent)] mt-3"></span>
              </h3>
              <p className="text-gray-300 text-[13px] leading-relaxed mb-6">
                {data.stayConnectedDesc}
              </p>
              
              {/* Subscription Box */}
              <div className="bg-[#052654] border border-[#0d3b7a] rounded-xl p-4 flex items-center gap-3 mb-8 cursor-pointer hover:bg-[#06306a] transition-colors group">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white shrink-0">
                  <FaEnvelope />
                </div>
                <div className="flex-grow">
                  <h5 className="font-bold text-white text-[13px]">{data.newsletterTitle}</h5>
                  <p className="text-gray-400 text-[11px] leading-snug mt-0.5">{data.newsletterDesc}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
                  <FaChevronRight className="text-[10px]" />
                </div>
              </div>

              {/* 3 Badges */}
              <div className="grid grid-cols-3 gap-0">
                <div className="flex flex-col items-center text-center">
                  <div className="text-[var(--color-accent)] text-2xl mb-1">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-tight">{data.badge1?.split('\\n').map((line, i) => <React.Fragment key={i}>{line}{i === 0 && <br/>}</React.Fragment>)}</p>
                </div>
                <div className="flex flex-col items-center text-center border-l border-[#1a3869]">
                  <div className="text-[var(--color-accent)] text-2xl mb-1">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-tight">{data.badge2?.split('\\n').map((line, i) => <React.Fragment key={i}>{line}{i === 0 && <br/>}</React.Fragment>)}</p>
                </div>
                <div className="flex flex-col items-center text-center border-l border-[#1a3869]">
                  <div className="text-[var(--color-accent)] text-2xl mb-1">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-tight">{data.badge3?.split('\\n').map((line, i) => <React.Fragment key={i}>{line}{i === 0 && <br/>}</React.Fragment>)}</p>
                </div>
              </div>

            </div>
            
          </div>
        </div>
      </div>
      
      {/* Copyright Bar with Snowflake */}
      <div className="bg-[#02183b] pb-6 relative">
        <div className="max-w-[1250px] mx-auto px-4 md:px-6 lg:px-8">
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-[1px] bg-[#113166] flex-grow max-w-[400px]"></div>
            <p className="text-gray-300 text-[13px]">{data.copyrightText}</p>
            <div className="h-[1px] bg-[#113166] flex-grow max-w-[400px]"></div>
          </div>
          
          <div className="flex justify-center text-[var(--color-accent)]">
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line><line x1="20" y1="16" x2="4" y2="8"></line><line x1="20" y1="8" x2="4" y2="16"></line><line x1="9" y1="4" x2="15" y2="4"></line><line x1="9" y1="20" x2="15" y2="20"></line><line x1="4" y1="9" x2="4" y2="15"></line><line x1="20" y1="9" x2="20" y2="15"></line></svg>
          </div>

        </div>
      </div>

      {/* Fixed Scroll To Top Button */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(0,123,255,0.4)] hover:bg-blue-600 hover:-translate-y-1 transition-all duration-300 animate-fade-in"
          aria-label="Scroll to top"
        >
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
        </button>
      )}

    </footer>
  );
};
