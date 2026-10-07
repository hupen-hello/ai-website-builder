'use client';
import type { SectionProps } from "../../../types/section";
import React from 'react';
import { ContactData } from "../../../lib/applianceTypes";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';

export const ContactSection = ({ data }: { data?: ContactData }) => {
  if (!data) return null;

  return (
    <section className="w-full bg-[#f8fbff] flex flex-col items-center">

      {/* Top Part: Title and Form/Info */}
      <div className="w-full max-w-[1250px] mx-auto px-4 md:px-8 py-16 lg:py-12 relative">

        {/* Background decorative curved shape could be added here, but we will keep it simple with colors */}

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-[1px] w-12 bg-[var(--color-accent)]"></span>
            <span className="text-[var(--color-accent)] font-bold text-sm tracking-widest uppercase">{data.subtitle}</span>
            <span className="h-[1px] w-12 bg-[var(--color-accent)]"></span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)] mb-6">
            {data.title1} <span className="text-[var(--color-accent)]">{data.title2}</span>
          </h2>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">

          {/* Left: Form */}
          <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative z-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xl flex-shrink-0">
                <FaFileAlt />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-1">{data.form?.title}</h3>
                <p className="text-gray-500 text-sm">{data.form?.description}</p>
              </div>
            </div>

            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-400">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </span>
                  <input type="text" placeholder="Your Name" className="w-full pl-12 pr-5 py-3.5 bg-transparent border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors" required />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-400">
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </span>
                  <input type="tel" placeholder="Your Phone" className="w-full pl-12 pr-5 py-3.5 bg-transparent border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors" required />
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-400">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <input type="email" placeholder="Your Email" className="w-full pl-12 pr-5 py-3.5 bg-transparent border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors" required />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-400">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </span>
                <textarea placeholder="Message" rows={4} className="w-full pl-12 pr-5 py-3.5 bg-transparent border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none" required></textarea>
              </div>

              <button type="submit" className="inline-flex items-center justify-center gap-3 bg-[var(--color-accent)] hover:brightness-95 text-white font-bold py-4 px-10 rounded-xl transition-colors text-[15px] w-full md:w-auto">
                {data.form?.buttonText} <span>→</span>
              </button>
            </form>
          </div>

          {/* Right: Contact Info */}
          <div className="relative flex flex-col justify-center min-h-[400px]">
            <h3 className="text-2xl font-bold text-[var(--color-primary)] mb-4">
              {data.contactInfo?.title}
            </h3>
            <span className="h-1 w-12 bg-[var(--color-accent)] mb-6 rounded-full block"></span>
            <p className="text-gray-500 text-sm mb-10 leading-relaxed max-w-md relative z-20">
              {data.contactInfo?.description}
            </p>

            <div className="space-y-8 relative z-20">
              {/* Phone */}
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-[#ebf3ff] flex items-center justify-center text-[var(--color-accent)] text-xl shrink-0">
                  <FaPhoneAlt />
                </div>
                <div>
                  <p className="text-[var(--color-primary)] font-bold text-[17px] mb-1">{data.contactInfo?.phoneTitle}</p>
                  <p className="text-[var(--color-accent)] font-bold text-[17px] leading-tight mb-1">{data.contactInfo?.phone}</p>
                  <p className="text-gray-500 text-[13px]">{data.contactInfo?.phoneDesc}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-[#ebf3ff] flex items-center justify-center text-[var(--color-accent)] text-xl shrink-0">
                  <FaEnvelope />
                </div>
                <div>
                  <p className="text-[var(--color-primary)] font-bold text-[17px] mb-1">{data.contactInfo?.emailTitle}</p>
                  <p className="text-[var(--color-primary)] font-semibold text-[15px] leading-tight mb-1">{data.contactInfo?.email}</p>
                  <p className="text-gray-500 text-[13px]">{data.contactInfo?.emailDesc}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-[#ebf3ff] flex items-center justify-center text-[var(--color-accent)] text-xl shrink-0">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <p className="text-[var(--color-primary)] font-bold text-[17px] mb-1">{data.contactInfo?.addressTitle}</p>
                  <p className="text-gray-500 text-[14px] leading-relaxed max-w-[200px]">{data.contactInfo?.address}</p>
                </div>
              </div>
            </div>

            {/* Technician Image */}
            <div className="hidden lg:block absolute bottom-[0px] right-[-40px] xl:right-[-60px] w-[350px] xl:w-[420px] z-10 pointer-events-none">
              <img src={data.technicianImage} alt="Technician" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Part: Map Section */}
      <div className="w-full max-w-[1250px] mx-auto px-4 md:px-8 pb-16 lg:pb-24">
        <div className="w-full relative h-[450px] lg:h-[450px] rounded-[24px] overflow-hidden shadow-lg">
          {/* Map Iframe */}
          <div className="absolute inset-0 w-full h-full">
            <iframe
              src={data.map?.url}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Our Location Box overlaid on the map */}
          <div className="absolute inset-0 px-6 md:px-10 lg:px-12 pointer-events-none flex items-center">
            <div className="bg-[var(--color-primary)] text-white p-8 rounded-[20px] w-full max-w-[320px] pointer-events-auto shadow-2xl relative overflow-hidden">
              {/* Background pattern/glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--color-accent)] rounded-full blur-[60px] opacity-40"></div>

              <div className="flex items-start gap-4 mb-6 relative z-10">
                <div className="text-white text-3xl mt-1">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">{data.map?.boxTitle}</h4>
                  <p className="text-gray-300 text-[14px] leading-relaxed">
                    {data.map?.boxAddress}
                  </p>
                </div>
              </div>

              <a href={`https://maps.google.com/?q=${encodeURIComponent(data.map?.boxAddress || '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary)] hover:bg-gray-100 font-bold py-3.5 px-6 rounded-full transition-colors text-[14px] w-max relative z-10">
                {data.map?.buttonText} <span className="text-[var(--color-accent)]">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function ServiceContactPage({ data = {} }: SectionProps) {
  return <ContactSection data={data as never} />;
}

