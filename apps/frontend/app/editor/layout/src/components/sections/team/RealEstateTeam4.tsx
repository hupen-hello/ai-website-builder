"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { resolveMediaSrc } from "../../../lib/resolveMediaSrc";

export interface Agent {
  id: string;
  name: string;
  email?: string;
  image: string;
  role?: string;
  details?: any;
  socials?: any;
  bio?: string[];
}

export default function RealEstateTeam4({ data = {} }: SectionProps) {
  // Use data.team if available, otherwise fallback
  const agents: Agent[] = Array.isArray(data.team)
    ? data.team
    : [
        {
          id: "rosalina-d-william",
          name: "Rosalina D. William",
          role: "Real Estate Broker",
          image: "/categories/realestate/template4/unsplash-fe7e8ed6.jpg",
          details: { email: "example@example.com" }
        },
        {
          id: "kelian-anderson",
          name: "Kelian Anderson",
          role: "Selling Agents",
          image: "/images/unsplash-ffb56da0.jpg",
          details: { email: "kelian@example.com" }
        },
        {
          id: "miranda-h-halim",
          name: "Miranda H. Halim",
          role: "Property Seller",
          image: "/images/unsplash-b1ef10eb.jpg",
          details: { email: "miranda@example.com" }
        },
        {
          id: "damble-d-browni",
          name: "Damble D. Browni",
          role: "Property Seller",
          image: "/images/unsplash-0098ef98.jpg",
          details: { email: "damble@example.com" }
        }
      ];

  return (
    <section className="py-8 md:py-12 bg-white" data-editor-section-label="Our Team">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold uppercase tracking-widest text-secondary mb-4" data-editor-field="teamTitle">
            {String(data.teamTitle ?? "Our Agents")}
          </h2>
          <div className="w-16 h-1 bg-[#0a8296] mx-auto rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.slice(0, 4).map((agent, idx) => (
            <div key={agent.id || idx} className="group text-center">
              <Link href={`/template4/team/${agent.id}`} className="block">
                <div className="overflow-hidden rounded-xl mb-4 bg-gray-100">
                  <img 
                    src={resolveMediaSrc(agent.image, idx)} 
                    alt={agent.name} 
                    className="w-full h-[300px] object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  />
                </div>
                <h4 className="text-lg font-bold text-secondary uppercase tracking-wider hover:text-[#0a8296] transition-colors">
                  {agent.name}
                </h4>
              </Link>
              <a href={`mailto:${agent.email || agent.details?.email}`} className="text-[#0a8296] text-sm hover:underline">
                {agent.email || agent.details?.email || "Email"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
