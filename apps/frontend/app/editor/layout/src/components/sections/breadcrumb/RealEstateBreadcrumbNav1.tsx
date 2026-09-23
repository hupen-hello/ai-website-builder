import Link from "next/link";

export type RealEstateBreadcrumbItem = {
  label: string;
  href?: string;
};

export default function RealEstateBreadcrumbNav1({
  items,
}: {
  items: RealEstateBreadcrumbItem[];
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-nowrap items-center gap-3 overflow-hidden whitespace-nowrap text-sm text-[#141414]/50 md:text-base"
    >
      {items.map((item, index) => (
        <span
          key={`${item.label}-${index}`}
          className="contents"
        >
          {index > 0 && (
            <span aria-hidden className="shrink-0 text-[#141414]/25">
              /
            </span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="shrink-0 transition hover:text-[#c44536]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="min-w-0 truncate text-[#141414]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
