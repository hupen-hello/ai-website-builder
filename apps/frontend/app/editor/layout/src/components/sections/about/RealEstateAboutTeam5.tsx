"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
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
    image: `${IMG}/hero_worker.png`,
  },
  {
    id: "jane-smith",
    name: "Jane Smith",
    role: "Interior Designer",
    image: `${IMG}/kitchen_reno.png`,
  },
  {
    id: "mike-johnson",
    name: "Mike Johnson",
    role: "Project Manager",
    image: `${IMG}/bathroom_reno.png`,
  },
  {
    id: "emily-davis",
    name: "Emily Davis",
    role: "Consultant",
    image: `${IMG}/office_reno.png`,
  },
];

export default function RealEstateAboutTeam5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const teamSubtitle = String(data.teamSubtitle || "Team Members");
  const teamTitle = String(data.teamTitle || "Our Professional Team");
  const team = (
    Array.isArray(data.team) && data.team.length ? data.team : defaultTeam
  ) as TeamMember[];
  const teamBase = String(data.teamDetailBasePath || "/teams");

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
      className="bg-[#0f172a] py-[30px]"
      data-editor-section-label="team"
      data-editor-fields="teamSubtitle teamTitle team teamDetailBasePath accentColor"
    >
      <div className="mx-auto max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-[60px] text-center">
          <div className="mb-4 text-[0.9rem] font-semibold tracking-wide text-[var(--accent)] uppercase">
            {teamSubtitle}
          </div>
          <h2 className="font-extrabold text-white">{teamTitle}</h2>
        </div>
        <div
          className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-4"
          data-box-layout-grid="grid"
        >
          {team.slice(0, 4).map((member) => {
            const href = `${teamBase}/${member.id || ""}`;
            return (
              <Link
                key={member.id || member.name}
                href={href}
                onClick={(event) =>
                  handleNavigate(event, href, String(member.name || "Team"))
                }
                className="flex cursor-pointer flex-col items-center text-center no-underline transition-transform duration-300 hover:-translate-y-2.5"
              >
                <div className="flex w-full border border-white/15 p-3">
                  <div className="h-[280px] w-full overflow-hidden">
                    <img
                      src={member.image || `${IMG}/hero_worker.png`}
                      alt={member.name || ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="pt-5 text-center">
                  <h4 className="mb-2 text-[1.25rem] font-bold text-white">
                    {member.name}
                  </h4>
                  <p className="m-0 text-[0.9rem] font-semibold text-[var(--accent)]">
                    {member.role}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
