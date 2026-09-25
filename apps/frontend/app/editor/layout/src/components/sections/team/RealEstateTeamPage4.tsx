"use client";

import type { ElementType, SVGProps } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  Home,
  Key,
  User,
  UserCheck,
} from "lucide-react";
import { teamPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  TeamPage4Data,
  TeamPage4Member,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const Facebook = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.61l.39-4H14V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Twitter = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const iconMap: Record<string, ElementType> = {
  User,
  Home,
  FileText,
  Key,
  Briefcase,
  UserCheck,
};

const HeadingDots = ({ reverse = false }: { reverse?: boolean }) => (
  <span className="flex gap-1" aria-hidden="true">
    {(reverse
      ? ["bg-[var(--accent)]", "bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]", "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]"]
      : ["bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]", "bg-[color-mix(in_srgb,var(--accent)_50%,transparent)]", "bg-[var(--accent)]"]
    ).map((className) => (
      <span
        key={className}
        className={`h-1 w-1 rounded-full ${className}`}
      />
    ))}
  </span>
);

function TeamCard({ member }: { member: TeamPage4Member }) {
  const Icon = iconMap[member.icon] ?? User;

  return (
    <article className="group flex flex-col items-center overflow-hidden rounded-[24px] border border-gray-100 bg-white pb-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative mb-10 h-80 w-full border-b-[3px] border-[var(--accent)]">
        <img
          src={member.image}
          alt={member.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          data-editor-media="image"
          data-editor-media-type="image"
        />
        <div className="absolute -bottom-7 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-[5px] border-white bg-[var(--accent)] text-white shadow-sm">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>

      <Link
        href={`/template4/team/${member.id}`}
        className="transition-colors hover:text-[var(--accent)]"
      >
        <h4
          className="mb-1 text-[22px] font-bold text-secondary"
          data-editor-field="name"
        >
          {member.name}
        </h4>
      </Link>
      <p
        className="mb-6 text-sm font-semibold tracking-wide text-[var(--accent)]"
        data-editor-field="role"
      >
        {member.role}
      </p>

      <div className="flex items-center gap-4 text-gray-400">
        {member.socials?.facebook && (
          <a
            href={member.socials.facebook}
            className="transition-colors hover:text-[var(--accent)]"
            aria-label={`${member.name} on Facebook`}
          >
            <Facebook className="h-4 w-4" />
          </a>
        )}
        {member.socials?.twitter && (
          <a
            href={member.socials.twitter}
            className="transition-colors hover:text-[var(--accent)]"
            aria-label={`${member.name} on Twitter`}
          >
            <Twitter className="h-4 w-4" />
          </a>
        )}
        {member.socials?.linkedin && (
          <a
            href={member.socials.linkedin}
            className="transition-colors hover:text-[var(--accent)]"
            aria-label={`${member.name} on LinkedIn`}
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

export default function RealEstateTeamPage4({ data = {} }: SectionProps) {
  const authored = teamPage4Content.RealEstateTeamPage4;
  const content: TeamPage4Data = {
    ...authored,
    ...(data as TeamPage4Data),
  };
  const team = content.team?.length ? content.team : (authored.team ?? []);

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="team"
      data-editor-fields="accentColor pretitle title description team"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <HeadingDots />
            <h3
              className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]"
              data-editor-field="pretitle"
            >
              {content.pretitle ?? "Meet Our Professionals"}
            </h3>
            <HeadingDots reverse />
          </div>
          <h2
            className="mb-6 text-3xl font-bold tracking-tight text-secondary md:text-5xl"
            data-editor-field="title"
          >
            {content.title ?? "Dedicated Professionals. Proven Results."}
          </h2>
          <p
            className="text-lg text-gray-600"
            data-editor-field="description"
          >
            {content.description ?? ""}
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          data-box-layout-grid="grid"
        >
          {team.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}
