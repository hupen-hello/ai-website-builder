export type ManagerCardTarget =
  | "Properties"
  | "Blogs"
  | "Services"
  | "Portfolio";

export type ManagerCardItem = {
  slug?: string;
  href?: string;
  id?: string;
  title?: string;
};

export const openManagerForCard = (
  manager: ManagerCardTarget,
  item: ManagerCardItem,
) => {
  try {
    window.sessionStorage.setItem(
      `ai-builder-open-manager-item:${manager}`,
      JSON.stringify(item),
    );
  } catch {
    /* ignore storage errors */
  }
  window.dispatchEvent(
    new CustomEvent("ai-builder-open-manager", {
      detail: { manager, preservePage: true },
    }),
  );
};

export const handleManagerCardClick = (
  event: { preventDefault: () => void; stopPropagation: () => void },
  editorMode: boolean | undefined,
  manager: ManagerCardTarget,
  item: ManagerCardItem,
) => {
  if (!editorMode) return;
  event.preventDefault();
  event.stopPropagation();
  openManagerForCard(manager, item);
};

export const slugFromListingHref = (href: string, kind: "properties" | "projects" | "blog") => {
  const pattern =
    kind === "properties"
      ? /\/properties\/([^/?#]+)/i
      : kind === "projects"
        ? /\/(?:projects|portfolio)\/([^/?#]+)/i
        : /\/(?:blog|blogs)\/([^/?#]+)/i;
  const match = href.match(pattern);
  return match ? decodeURIComponent(match[1]) : "";
};
