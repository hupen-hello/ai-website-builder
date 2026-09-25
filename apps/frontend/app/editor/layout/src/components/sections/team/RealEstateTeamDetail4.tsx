"use client";

import { Home, UserCheck, Shield } from "lucide-react";
import Link from "next/link";
import { Agent } from "./RealEstateTeam4";

export default function RealEstateTeamDetail4({ member }: { member: Agent }) {
  if (!member) return <div>Member not found</div>;

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 lg:items-start">
          {/* Left Column - Profile */}
          <div className="w-full lg:w-1/3 flex flex-col items-center lg:sticky lg:top-32">
            <div className="w-full bg-gray-100 aspect-[4/5] overflow-hidden mb-6 rounded-xl shadow-sm">
              <img 
                src={member.image || "/images/placeholder.jpg"} 
                alt={member.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-secondary mb-2">{member.name}</h3>
            <p className="text-[#0a8296] font-bold text-xs tracking-widest uppercase">{member.role}</p>
          </div>

          {/* Right Column - Details */}
          <div className="w-full lg:w-2/3">
            {member.bio && member.bio[0] && (
              <p className="text-gray-600 leading-relaxed mb-10 text-[15px]">
                {member.bio[0]}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mb-10 text-[15px]">
              <div className="flex">
                <span className="font-bold text-secondary w-32 shrink-0">Positions:</span>
                <span className="text-gray-500">{member.details?.position}</span>
              </div>
              <div className="flex">
                <span className="font-bold text-secondary w-32 shrink-0">Email:</span>
                <span className="text-[#0a8296]">{member.email || member.details?.email}</span>
              </div>
              <div className="flex">
                <span className="font-bold text-secondary w-32 shrink-0">Experience:</span>
                <span className="text-gray-500">{member.details?.experience}</span>
              </div>
              <div className="flex">
                <span className="font-bold text-secondary w-32 shrink-0">Fax:</span>
                <span className="text-gray-500">{member.details?.fax}</span>
              </div>
              <div className="flex">
                <span className="font-bold text-secondary w-32 shrink-0">Location:</span>
                <span className="text-gray-500">{member.details?.location}</span>
              </div>
              <div className="flex">
                <span className="font-bold text-secondary w-32 shrink-0">Phone:</span>
                <span className="text-gray-500">{member.details?.phone}</span>
              </div>
              <div className="flex">
                <span className="font-bold text-secondary w-32 shrink-0">Practice Area:</span>
                <span className="text-gray-500">{member.details?.practiceArea}</span>
              </div>
            </div>

            {/* Middle Bio */}
            {member.bio && member.bio[1] && (
              <p className="text-gray-600 leading-relaxed mb-12 text-[15px]">
                {member.bio[1]}
              </p>
            )}

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Card 1 */}
              <div className="border border-gray-200 hover:border-[#0a8296] hover:border-b-[3px] rounded-lg p-8 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-[#0a8296] group-hover:text-white group-hover:bg-[#0a8296] group-hover:border-[4px] group-hover:border-white group-hover:ring-1 group-hover:ring-gray-100 mb-6 transition-all duration-300">
                  <Home className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h4 className="font-bold text-lg text-secondary mb-3">Home Buying</h4>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
              </div>

              {/* Card 2 */}
              <div className="border border-gray-200 hover:border-[#0a8296] hover:border-b-[3px] rounded-lg p-8 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-[#0a8296] group-hover:text-white group-hover:bg-[#0a8296] group-hover:border-[4px] group-hover:border-white group-hover:ring-1 group-hover:ring-gray-100 mb-6 transition-all duration-300">
                  <UserCheck className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h4 className="font-bold text-lg text-secondary mb-3">Home Selling</h4>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
              </div>

              {/* Card 3 */}
              <div className="border border-gray-200 hover:border-[#0a8296] hover:border-b-[3px] rounded-lg p-8 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group">
                <div className="w-16 h-16 rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-[#0a8296] group-hover:text-white group-hover:bg-[#0a8296] group-hover:border-[4px] group-hover:border-white group-hover:ring-1 group-hover:ring-gray-100 mb-6 transition-all duration-300">
                  <Shield className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <h4 className="font-bold text-lg text-secondary mb-3">Escrow Services</h4>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
              </div>
            </div>

            {/* Bottom Bio */}
            {member.bio && member.bio[2] && (
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {member.bio[2]}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
