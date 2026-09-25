"use client";

import type { ElementType } from "react";
import { Home, Shield, UserCheck } from "lucide-react";
import {
  teamDetailPage4Content,
  teamPage4Content,
} from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  TeamDetailPage4Data,
  TeamDetailServiceCard4,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Home,
  UserCheck,
  Shield,
};

const FALLBACK_IMAGE =
  "/categories/realestate/template4/unsplash-fe7e8ed6.jpg";

const defaultServiceCards: TeamDetailServiceCard4[] = [
  {
    id: "home-buying",
    icon: "Home",
    title: "Home Buying",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
  },
  {
    id: "home-selling",
    icon: "UserCheck",
    title: "Home Selling",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
  },
  {
    id: "escrow-services",
    icon: "Shield",
    title: "Escrow Services",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
  },
];

export default function RealEstateTeamDetailPage4({
  data = {},
}: SectionProps) {
  const authored = teamDetailPage4Content.RealEstateTeamDetailPage4;
  const listingTeam = teamPage4Content.RealEstateTeamPage4.team ?? [];
  const content: TeamDetailPage4Data = {
    ...authored,
    ...(data as TeamDetailPage4Data),
  };
  const matchedMember =
    listingTeam.find((member) => member.id === content.id) ?? listingTeam[0];
  const name = content.name ?? matchedMember?.name ?? "Team Member";
  const role = content.role ?? matchedMember?.role ?? "";
  const image = content.image ?? matchedMember?.image ?? FALLBACK_IMAGE;
  const bio = content.bio?.length ? content.bio : matchedMember?.bio;
  const details = content.details ?? matchedMember?.details;
  const serviceCards = content.serviceCards?.length
    ? content.serviceCards
    : (authored.serviceCards ?? defaultServiceCards);

  if (!name) {
    return <div>Member not found</div>;
  }

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="teamDetail"
      data-editor-fields="accentColor id name role image bio details serviceCards"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20">
          <div className="flex w-full flex-col items-center lg:sticky lg:top-32 lg:w-1/3">
            <div className="mb-6 aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm">
              <img
                src={image}
                alt={name}
                className="h-full w-full object-cover"
                data-editor-media="image"
                data-editor-media-type="image"
              />
            </div>
            <h3
              className="mb-2 text-2xl font-bold text-secondary"
              data-editor-field="name"
            >
              {name}
            </h3>
            <p
              className="text-xs font-bold tracking-widest text-[var(--accent)] uppercase"
              data-editor-field="role"
            >
              {role}
            </p>
          </div>

          <div className="w-full lg:w-2/3">
            {bio?.[0] ? (
              <p className="mb-10 text-[15px] leading-relaxed text-gray-600">
                {bio[0]}
              </p>
            ) : null}

            <div className="mb-10 grid grid-cols-1 gap-x-8 gap-y-4 text-[15px] md:grid-cols-2">
              <div className="flex">
                <span className="w-32 shrink-0 font-bold text-secondary">
                  Positions:
                </span>
                <span className="text-gray-500">{details?.position}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-bold text-secondary">
                  Email:
                </span>
                <span className="text-[var(--accent)]">{details?.email}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-bold text-secondary">
                  Experience:
                </span>
                <span className="text-gray-500">{details?.experience}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-bold text-secondary">
                  Fax:
                </span>
                <span className="text-gray-500">{details?.fax}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-bold text-secondary">
                  Location:
                </span>
                <span className="text-gray-500">{details?.location}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-bold text-secondary">
                  Phone:
                </span>
                <span className="text-gray-500">{details?.phone}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-bold text-secondary">
                  Practice Area:
                </span>
                <span className="text-gray-500">{details?.practiceArea}</span>
              </div>
            </div>

            {bio?.[1] ? (
              <p className="mb-12 text-[15px] leading-relaxed text-gray-600">
                {bio[1]}
              </p>
            ) : null}

            <div
              className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3"
              data-box-layout-grid="grid"
            >
              {serviceCards.map((card) => {
                const Icon = iconMap[card.icon ?? "Home"] ?? Home;

                return (
                  <article
                    key={card.id ?? card.title}
                    className="group flex flex-col items-center rounded-lg border border-gray-200 p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[var(--accent)] hover:border-b-[3px] hover:shadow-lg"
                  >
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 text-[var(--accent)] shadow-sm transition-all duration-300 group-hover:border-[4px] group-hover:border-white group-hover:bg-[var(--accent)] group-hover:text-white group-hover:ring-1 group-hover:ring-gray-100">
                      <Icon className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                    <h4
                      className="mb-3 text-lg font-bold text-secondary"
                      data-editor-field="title"
                    >
                      {card.title}
                    </h4>
                    <p
                      className="mb-6 text-sm leading-relaxed text-gray-500"
                      data-editor-field="description"
                    >
                      {card.description}
                    </p>
                  </article>
                );
              })}
            </div>

            {bio?.[2] ? (
              <p className="text-[15px] leading-relaxed text-gray-600">
                {bio[2]}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
