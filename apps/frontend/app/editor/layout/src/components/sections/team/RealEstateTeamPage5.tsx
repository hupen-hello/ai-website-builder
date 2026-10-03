"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type TeamMember = {
  id?: string;
  name?: string;
  role?: string;
  image?: string;
};

const IMG = "/categories/realestate/template5";

const defaultTeam: TeamMember[] = [
  {
    id: "john-doe",
    name: "John Doe",
    role: "Lead Architect",
    image: `${IMG}/team1.jpg`,
  },
  {
    id: "jane-smith",
    name: "Jane Smith",
    role: "Interior Designer",
    image: `${IMG}/team3.jpg`,
  },
  {
    id: "mike-johnson",
    name: "Mike Johnson",
    role: "Project Manager",
    image: `${IMG}/team4.jpg`,
  },
  {
    id: "emily-davis",
    name: "Emily Davis",
    role: "Consultant",
    image: `${IMG}/team6.jpg`,
  },
];

export default function RealEstateTeamPage5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(
    data.pretitle || data.subtitle || "Team Members",
  );
  const title = String(data.title || "Our Professional Team");
  const description = String(data.description || "");
  const detailBase = String(
    data.teamDetailBasePath || data.detailBasePath || "/teams",
  ).replace(/\/$/, "");

  const team = (
    Array.isArray(data.team) && data.team.length
      ? data.team
      : Array.isArray(data.teams) && data.teams.length
        ? data.teams
        : defaultTeam
  ) as TeamMember[];

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  return (
    <section
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="team"
      data-editor-fields="accentColor pretitle title description team teamDetailBasePath"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-[0.9rem] font-semibold tracking-[0.1em] text-[var(--accent)] uppercase">
            <span data-editor-field="pretitle">{pretitle}</span>
          </div>
          <h2
            className="m-0 font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          {description ? (
            <p
              className="mx-auto mt-4 max-w-2xl text-base text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          data-box-layout-grid="grid"
        >
          {team.map((member) => {
            const href = `${detailBase}/${member.id || ""}`;
            const name = String(member.name || "Team Member");
            return (
              <article
                key={member.id || name}
                className="relative overflow-hidden rounded bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
              >
                <div className="h-80 overflow-hidden">
                  <img
                    src={member.image || `${IMG}/hero_worker.png`}
                    alt={name}
                    className="h-full w-full object-cover"
                    data-editor-media="image"
                    data-editor-media-type="image"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 p-6">
                  <div>
                    <h3 className="mb-1 text-[1.2rem] font-bold text-[#333]">
                      <Link
                        href={href}
                        onClick={(event) => handleNavigate(event, href, name)}
                        className="text-inherit no-underline transition-colors hover:text-[var(--accent)]"
                        data-editor-field="name"
                      >
                        {name}
                      </Link>
                    </h3>
                    <p
                      className="m-0 text-[0.9rem] font-medium text-[var(--accent)]"
                      data-editor-field="role"
                    >
                      {member.role}
                    </p>
                  </div>
                  <Link
                    href={href}
                    onClick={(event) => handleNavigate(event, href, name)}
                    aria-label={`View ${name}`}
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden="true"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
