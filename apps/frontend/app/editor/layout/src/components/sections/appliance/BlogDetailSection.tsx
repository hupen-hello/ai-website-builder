'use client';
import React from 'react';
import { BlogItem } from './applianceTypes';
import { FaUser, FaFolder, FaCommentAlt, FaQuoteLeft, FaBolt, FaWrench, FaShieldAlt, FaCalendarAlt } from 'react-icons/fa';
import { ApplianceLink as Link } from "./ApplianceLink";

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'FaBolt': return <FaBolt />;
    case 'FaWrench': return <FaWrench />;
    case 'FaShieldAlt': return <FaShieldAlt />;
    default: return <FaBolt />;
  }
};

export const BlogDetailSection = ({ blog }: { blog: BlogItem }) => {
  const { detail } = blog;
  if (!detail) return null;

  return (
    <section className="w-full py-16 lg:py-12 bg-white">
      <div className="max-w-[1250px] mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-12">

          {/* Left Column - Main Content */}
          <div className="w-full lg:w-[68%]">

            {/* Top Image & Date Badge */}
            <div className="relative rounded-[20px] overflow-hidden mb-8 h-[350px] sm:h-[450px]">
              <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
              {/* Date Badge */}
              <div className="absolute bottom-6 left-6 bg-[#051838] text-white px-5 py-3 rounded-xl flex flex-col items-center justify-center min-w-[80px]">
                <span className="text-2xl font-bold leading-none mb-1">{blog.date.split(' ')[1].replace(',', '')}</span>
                <span className="text-[11px] font-medium uppercase tracking-widest">{blog.date.split(' ')[0]} {blog.date.split(' ')[2]}</span>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-[13px] font-semibold text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <FaUser className="text-[#007bff]" />
                By {detail.author}
              </div>
              <div className="flex items-center gap-2">
                <FaFolder className="text-[#007bff]" />
                {blog.category}
              </div>
              <div className="flex items-center gap-2">
                <FaCommentAlt className="text-[#007bff]" />
                {detail.commentsCount} Comments
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-[38px] md:text-[42px] font-extrabold text-[#051838] leading-[1.2] mb-6">
              {detail.title1} <span className="text-[#007bff]">{detail.title2}</span>
            </h1>

            {/* Intro Text */}
            <p className="text-gray-500 text-[15px] sm:text-base leading-relaxed mb-10">
              {detail.intro}
            </p>

            {/* Features List */}
            <div className="flex flex-col gap-8 mb-10">
              {detail.features.map((feat: any) => (
                <div key={feat.id} className="flex items-start gap-5">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-[#f4f7fb] flex items-center justify-center text-[#007bff] text-2xl shadow-sm">
                    {renderIcon(feat.icon || '')}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#051838] mb-2">{feat.title}</h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Blockquote */}
            <div className="bg-[#f4f7fb] rounded-[20px] p-8 md:p-10 mb-10 relative">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-[#007bff] text-xl mb-4">
                <FaQuoteLeft />
              </div>
              <p className="text-[#051838] text-[17px] md:text-[19px] font-medium italic leading-relaxed">
                "{detail.quote}"
              </p>
            </div>

            {/* Conclusion Text */}
            <p className="text-gray-500 text-[15px] sm:text-base leading-relaxed mb-10">
              {detail.conclusion}
            </p>

            {/* Bottom Image */}
            <div className="rounded-[20px] overflow-hidden h-[250px] sm:h-[300px]">
              <img src={detail.bottomImage} alt="Conclusion" className="w-full h-full object-cover" />
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full lg:w-[32%] flex flex-col gap-10 sticky top-8">

            {/* Categories */}
            <div className="bg-[#fcfdff] rounded-[20px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-bold text-[#051838] mb-6">{detail.sidebar.categoriesTitle}</h3>
              <ul className="flex flex-col gap-4">
                {detail.sidebar.categories.map((cat: any) => (
                  <li key={cat.id}>
                    <Link href={cat.url} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3 text-gray-500 group-hover:text-[#007bff] transition-colors">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
                        <span className="font-medium text-[15px]">{cat.name}</span>
                      </div>
                      <span className="text-gray-400 font-medium group-hover:text-[#007bff] transition-colors">({cat.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Posts */}
            <div className="bg-[#fcfdff] rounded-[20px] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#051838]">{detail.sidebar.recentPostsTitle}</h3>
                <Link href={detail.sidebar.recentPostsUrl} className="text-[#007bff] text-sm font-bold flex items-center gap-1 hover:underline">
                  {detail.sidebar.recentPostsLinkText.replace('->', '')} <span>→</span>
                </Link>
              </div>
              <div className="flex flex-col gap-5">
                {detail.sidebar.recentPosts?.map((post: any) => (
                  <Link key={post.id} href={post.url} className="flex items-center gap-4 group">
                    <div className="w-[85px] h-[75px] rounded-[10px] overflow-hidden shrink-0">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#051838] text-[14px] leading-tight mb-2 group-hover:text-[#007bff] transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium">
                        <FaCalendarAlt className="text-[#007bff]" />
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Ad Banner */}
            <div className="bg-[#051838] rounded-[20px] p-8 relative overflow-hidden text-white flex flex-col items-start">
              {/* Background Graphic */}
              <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-[#007bff]">
                  <path d="M50,0 C80,40 20,60 100,100 L100,0 Z" fill="currentColor" />
                </svg>
              </div>

              <div className="relative z-10 w-full lg:w-[65%] mb-0">
                <h3 className="text-2xl font-bold mb-3 leading-tight text-white">
                  {detail.sidebar.adBanner.title}
                </h3>
                <p className="text-white/80 text-[13px] mb-6 leading-relaxed">
                  {detail.sidebar.adBanner.description}
                </p>
                <Link href={detail.sidebar.adBanner.buttonUrl} className="inline-flex items-center gap-2 bg-[#007bff] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-colors text-[13px]">
                  {detail.sidebar.adBanner.buttonText.replace('->', '')} <span>→</span>
                </Link>
              </div>

              <div className="absolute bottom-0 right-[-10px] w-[140px] sm:w-[150px] z-10 pointer-events-none">
                <img src={detail.sidebar.adBanner.image} alt="Technician" className="w-full h-auto drop-shadow-xl" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
