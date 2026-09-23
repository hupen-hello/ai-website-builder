"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import RealEstateBreadCrumb1 from "../breadcrumb/RealEstateBreadCrumb1";

type SitemapLink = { label: string; href: string };
type SitemapGroup = { title: string; links: SitemapLink[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getGroups = (value: unknown): SitemapGroup[] =>
  Array.isArray(value)
    ? value.flatMap((group) => {
        if (!isRecord(group) || typeof group.title !== "string" || !Array.isArray(group.links)) return [];
        const links = group.links.flatMap((link) =>
          isRecord(link) && typeof link.label === "string" && typeof link.href === "string"
            ? [{ label: link.label, href: link.href }]
            : [],
        );
        return [{ title: group.title, links }];
      })
    : [];

export default function RealEstateSitemap1({ data = {} }: SectionProps) {
  const groups = getGroups(data.groups);
  return (
    <main className="bg-white text-[#141414]">
      <RealEstateBreadCrumb1
        pretitle={data.pretitle ?? "Explore"}
        title={data.title ?? "Sitemap"}
        desc={data.desc}
      />
      <section
        data-editor-section-label="Sitemap Links"
        data-editor-fields="groups"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div data-box-layout-grid="grid" className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <section key={group.title} className="rounded-[1.15rem] border border-[#141414]/10 bg-[#f8f6f1] p-6">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <ul className="mt-5 space-y-1">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}-${link.label}`}>
                    <Link href={link.href} className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-[#141414]/65 transition hover:bg-white hover:text-[#141414]">
                      {link.label}<ArrowRight size={13} className="opacity-35 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
