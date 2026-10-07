"use client";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { resolveApplianceBreadcrumbView } from "../../../lib/applianceBreadcrumb";
import React from 'react';
import { ApplianceLink as Link } from "../../../lib/applianceLink";
import { FaAngleDoubleRight } from 'react-icons/fa';

export const Breadcrumb = ({ data }: { data?: any }) => {
  if (!data) return null;

  return (
    <section 
      className="w-full relative py-20 md:py-24 z-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${data.bgImage || '/main logo/breadcrumb.jpg'}')` }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[var(--color-primary)]/90 z-0"></div>

      <div className="max-w-[1250px] mx-auto px-4 md:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-[44px] font-bold text-white mb-4">
          {data.title}
        </h1>
        <div className="flex items-center justify-center gap-2 text-[15px] font-medium">
          {(data.breadcrumbs || data.paths)?.map((path: any, index: number) => (
            <React.Fragment key={index}>
              {path.url || path.href ? (
                <Link href={path.url || path.href} className="text-[var(--color-accent)] hover:text-blue-400 transition-colors">
                  {path.label}
                </Link>
              ) : (
                <span className="text-white font-semibold">{path.label}</span>
              )}
              {index < (data.breadcrumbs || data.paths).length - 1 && (
                <span className="text-white mx-1 text-[16px] font-normal">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function ServiceBreadcrumb1({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const view = resolveApplianceBreadcrumbView({
    currentPage: preview?.currentPage,
    data: data as Record<string, unknown>,
  });
  return (
    <Breadcrumb
      data={{
        ...data,
        title: view.title,
        bgImage: view.bgImage,
        breadcrumbs: view.breadcrumbs,
      }}
    />
  );
}

