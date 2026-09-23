import type { PageLink } from "../../context/PreviewContext";

export const findProductPageName = (
  pageLinks: PageLink[],
  requestedPage: string,
): string | null => {
  const normalizedPage = requestedPage.trim().toLowerCase();

  for (const pageLink of pageLinks) {
    if (pageLink.label.trim().toLowerCase() === normalizedPage) {
      return pageLink.label;
    }

    const childPage = findProductPageName(
      pageLink.children ?? [],
      requestedPage,
    );
    if (childPage) return childPage;
  }

  return null;
};

export const scrollProductPageToTop = () => {
  const scrollContainer = document.querySelector<HTMLElement>(
    "[data-template-scroll]",
  );

  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};
