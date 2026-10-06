"use client";

import React from 'react';
import { EnquiryData } from './applianceTypes';
import { FiArrowRight, FiCalendar } from 'react-icons/fi';

export const EnquirySection = ({ data, globalUI }: { data?: EnquiryData, globalUI?: Record<string, string> }) => {
  if (!data) return null;

  return (
    <section className="w-full bg-white relative">
      <div className="pt-8 lg:pt-12 pb-0">
        <div className="max-w-[1250px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* Left Column: Quote Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-[var(--color-accent)]" />
              <h4 className="text-[var(--color-accent)] font-bold text-xs tracking-widest uppercase">
                {data.subtitle}
              </h4>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[var(--color-primary)] leading-tight mb-6">
              {data.title1} <br className="hidden md:block" />
              <span className="text-[var(--color-accent)]">{data.title2}</span>
            </h2>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-10 max-w-md">
              {data.description}
            </p>

            <div className="flex flex-col gap-8">
              {data.features.map((feature, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <h4 className="text-lg font-bold text-[var(--color-primary)]">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 md:p-10">
            <h3 className="text-3xl font-extrabold text-[var(--color-primary)] mb-3">
              {data.form.title1} <span className="text-[var(--color-accent)]">{data.form.title2}</span>
            </h3>
            <p className="text-gray-500 text-sm mb-8">
              {data.form.description}
            </p>

            <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Phone Number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors appearance-none">
                  <option value="">{globalUI?.chooseServiceText || 'Choose Service'}</option>
                  {data.form.servicesList?.map((service, idx) => (
                    <option key={idx} value={service}>{service}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  onFocus={(e) => (e.target.type = 'date')}
                  onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                  placeholder="Preferred Date (Optional)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <FiCalendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <input
                type="text"
                placeholder="Subject"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />

              <textarea
                placeholder="Your Message"
                rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
              ></textarea>

              <button
                type="submit"
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 mt-2"
              >
                {data.form.buttonText.replace('->', '')}
                <FiArrowRight className="text-lg" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};
