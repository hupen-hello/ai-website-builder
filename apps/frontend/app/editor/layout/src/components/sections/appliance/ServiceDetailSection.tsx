'use client';
import React from 'react';
import { ServiceDetailData } from './applianceTypes';
import { ApplianceLink as Link } from "./ApplianceLink";
import { FaAngleRight, FaPhoneAlt, FaCheck, FaCog, FaShieldAlt, FaBolt, FaWallet } from 'react-icons/fa';

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'FaCog': return <FaCog />;
    case 'FaShieldAlt': return <FaShieldAlt />;
    case 'FaBolt': return <FaBolt />;
    case 'FaWallet': return <FaWallet />;
    default: return <FaCog />;
  }
};

export const ServiceDetailSection = ({ data }: { data?: ServiceDetailData }) => {
  if (!data) return null;

  return (
    <section className="w-full py-16 lg:py-12 bg-white">
      <div className="max-w-[1250px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">

          {/* Left Main Content */}
          <div className="w-full lg:w-[65%] flex flex-col gap-8">
            {/* Images */}
            {data.images ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 rounded-[16px] overflow-hidden bg-gray-100 aspect-video md:aspect-auto h-full">
                  {data.images.main && <img src={data.images.main} alt="Main" className="w-full h-full object-cover" />}
                </div>
                <div className="md:col-span-4 flex flex-col gap-4">
                  <div className="rounded-[16px] overflow-hidden bg-gray-100 h-1/2 min-h-[160px]">
                    {data.images.small1 && <img src={data.images.small1} alt="Small 1" className="w-full h-full object-cover" />}
                  </div>
                  <div className="rounded-[16px] overflow-hidden bg-gray-100 h-1/2 min-h-[160px]">
                    {data.images.small2 && <img src={data.images.small2} alt="Small 2" className="w-full h-full object-cover" />}
                  </div>
                </div>
              </div>
            ) : data.imageMain ? (
              <div className="w-full rounded-[16px] overflow-hidden bg-gray-100 aspect-video">
                <img src={data.imageMain} alt="Main" className="w-full h-full object-cover" />
              </div>
            ) : null}

            <h2 className="text-4xl md:text-5xl font-extrabold text-[#051838] leading-tight tracking-tight mt-4">
              {data.title1} <span className="text-[#007bff]">{data.title2}</span>
            </h2>

            <div className="flex flex-col gap-4 text-[#4a5568] text-[15px] sm:text-[16px] leading-relaxed">
              {data.descriptions?.map((desc, i) => (
                <p key={i}>{desc}</p>
              ))}
              {!data.descriptions && data.description && <p>{data.description}</p>}
              {!data.descriptions && data.overviewText?.map((desc, i) => (
                <p key={i}>{desc}</p>
              ))}
            </div>

            <div className="bg-[#f4f7fb] rounded-[16px] p-6 lg:p-8 mt-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                {data.features?.map((feat, i) => (
                  <div key={feat.id} className={`flex items-start gap-4 ${i !== 0 ? 'pt-4 sm:pt-0 sm:pl-4 lg:pl-6' : ''}`}>
                    <div className="w-12 h-12 rounded-full bg-[#007bff] flex items-center justify-center text-white text-xl flex-shrink-0 shadow-lg shadow-blue-500/30">
                      {renderIcon(feat.icon || '')}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#051838] text-[15px] mb-1 leading-snug">
                        {feat.title}
                      </h4>
                      <p className="text-gray-500 text-[13px] leading-tight">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {data.typesTitle1 && data.types && (
              <>
                <h3 className="text-3xl md:text-[34px] font-extrabold text-[#051838] mt-4 mb-6">
                  {data.typesTitle1} <span className="text-[#007bff]">{data.typesTitle2}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {data.types.map((type) => (
                    <div key={type.id} className="flex flex-col bg-white rounded-[16px] overflow-hidden border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.04)] group">
                      <div className="w-full h-[220px] bg-gray-50 overflow-hidden p-4">
                        <img src={type.image} alt={type.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-6 text-center">
                        <h4 className="font-bold text-[#051838] text-[18px] mb-2">{type.title}</h4>
                        <p className="text-gray-500 text-[14px] leading-relaxed">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.processTitle && data.processSteps && (
              <>
                <h3 className="text-3xl md:text-[34px] font-extrabold text-[#051838] mt-4 mb-6">
                  {data.processTitle}
                </h3>
                <div className="flex flex-col gap-6">
                  {data.processSteps.map((step) => (
                    <div key={step.id} className="flex items-start gap-5 bg-[#f4f7fb] p-6 rounded-[16px]">
                      <div className="w-14 h-14 rounded-full bg-[#007bff] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                        {step.number}
                      </div>
                      <div>
                        <h4 className="font-bold text-[#051838] text-[18px] mb-2">{step.title}</h4>
                        <p className="text-gray-500 text-[14px] leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {data.faqTitle && data.faqs && (
              <>
                <h3 className="text-3xl md:text-[34px] font-extrabold text-[#051838] mt-10 mb-6">
                  {data.faqTitle}
                </h3>
                <div className="flex flex-col gap-4">
                  {data.faqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-[12px] p-5">
                      <h4 className="font-bold text-[#051838] text-[16px] mb-2">{faq.question}</h4>
                      <p className="text-gray-500 text-[14px] leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[35%] flex flex-col gap-8 sticky top-8">
            <div>
              <h3 className="text-2xl font-extrabold text-[#051838] mb-6">
                {data.sidebar?.servicesTitle || 'Our Services'}
              </h3>
              <div className="flex flex-col gap-3">
                {data.sidebar.servicesList.map((srv: any) => (
                  <Link key={srv.id} href={srv.url} className="flex items-center justify-between p-3 pl-4 pr-5 rounded-[12px] bg-[#f4f7fb] hover:bg-[#007bff] hover:text-white transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-10 rounded-md overflow-hidden bg-white">
                        <img src={srv.image} alt={srv.title} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-[15px] text-[#051838] group-hover:text-white transition-colors">
                        {srv.title}
                      </span>
                    </div>
                    <FaAngleRight className="text-[#007bff] group-hover:text-white transition-colors text-lg" />
                  </Link>
                ))}
              </div>
            </div>

            {data.sidebar?.helpBox && (
            <div className="bg-[#0042a4] rounded-[20px] p-8 relative overflow-hidden text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="relative z-10 w-full lg:w-[60%] flex flex-col items-start">
                <h3 className="text-2xl font-bold mb-3 leading-tight text-white">
                  {data.sidebar.helpBox.title}
                </h3>
                <p className="text-white/90 text-[14px] mb-6 leading-relaxed">
                  {data.sidebar.helpBox.description}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#007bff] flex items-center justify-center text-white text-xl flex-shrink-0 shadow-lg shadow-blue-500/30">
                    <FaPhoneAlt className="text-lg" />
                  </div>
                  <div>
                    <span className="block text-white/80 text-[12px] font-medium mb-1">
                      {data.sidebar.helpBox.buttonText}
                    </span>
                    <a href={`tel:${(data.sidebar.helpBox.phone || '').replace(/[^0-9+]/g, '')}`} className="block text-white font-bold text-[19px] whitespace-nowrap hover:text-white/80 transition-colors">
                      {data.sidebar.helpBox.phone}
                    </a>
                  </div>
                </div>
              </div>
              <div className="relative z-10 w-[140px] sm:w-[180px] self-end lg:self-end -mb-8 lg:-mr-6 mt-4 lg:mt-0 flex-shrink-0">
                <img src={data.sidebar.helpBox.image} alt="Technician" className="w-full h-auto drop-shadow-xl" />
              </div>
            </div>
            )}

            {data.sidebar?.whyChooseUs && (
            <div className="bg-[#f4f7fb] rounded-[20px] p-8 shadow-sm">
              <h3 className="text-2xl font-extrabold text-[#051838] mb-6">
                {data.sidebar.whyChooseUs.title}
              </h3>
              <ul className="flex flex-col gap-4">
                {data.sidebar.whyChooseUs.list.map((item: any, i: number) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#007bff] flex items-center justify-center text-white text-xs shrink-0 shadow-sm">
                      <FaCheck />
                    </div>
                    <span className="text-[#4a5568] font-medium text-[15px]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
