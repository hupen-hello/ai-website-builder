type Crumb = { label?: string; href?: string; url?: string };

export function resolveApplianceBreadcrumbView({
  currentPage,
  data,
}: {
  currentPage?: string;
  pageSlug?: string;
  data?: Record<string, unknown>;
}) {
  const source = data || {};
  const pageName = String(currentPage || "").trim();
  const savedTitle = String(source.title || "").trim();
  const title =
    pageName && pageName.toLowerCase() !== "home" ? pageName : savedTitle || "Page";
  const rawPaths = Array.isArray(source.breadcrumbs)
    ? (source.breadcrumbs as Crumb[])
    : Array.isArray(source.paths)
      ? (source.paths as Crumb[])
      : [];
  const saved = rawPaths
    .map((item) => ({
      label: String(item?.label || "").trim(),
      href: String(item?.href || item?.url || ""),
    }))
    .filter((item) => item.label);
  const last = saved[saved.length - 1]?.label || "";
  const breadcrumbs =
    saved.length > 0 && last.toLowerCase() === title.toLowerCase()
      ? saved
      : [
          { label: "Home", href: "/" },
          { label: title, href: "" },
        ];
  return {
    title,
    bgImage: String(source.bgImage || "/main logo/breadcrumb.jpg"),
    breadcrumbs,
  };
}
