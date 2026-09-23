import type { EditorDraftPageLink } from "./editorDraft";

export type EditorRevision = {
  id: string;
  createdAt: number;
  siteId?: string;
  templateId: string;
  category: string;
  sections: unknown[];
  pageLinks: EditorDraftPageLink[];
  templateVariables: Record<string, string>;
};

const REVISION_PREFIX = "css-ai-editor-revisions";
const MAX_REVISIONS = 3;

const getRevisionKey = (
  templateId: string,
  category: string,
  siteId?: string | null,
) =>
  `${REVISION_PREFIX}:${encodeURIComponent(siteId || "local")}:${encodeURIComponent(templateId)}:${encodeURIComponent(category)}`;

const isRevision = (value: unknown): value is EditorRevision => {
  if (!value || typeof value !== "object") return false;
  const revision = value as EditorRevision;
  return (
    typeof revision.id === "string" &&
    typeof revision.createdAt === "number" &&
    typeof revision.templateId === "string" &&
    typeof revision.category === "string" &&
    Array.isArray(revision.sections) &&
    Array.isArray(revision.pageLinks) &&
    typeof revision.templateVariables === "object" &&
    revision.templateVariables !== null
  );
};

export function readEditorRevisions(
  templateId: string,
  category: string,
  siteId?: string | null,
): EditorRevision[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(
      getRevisionKey(templateId, category, siteId),
    );
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(isRevision).sort((a, b) => b.createdAt - a.createdAt)
      : [];
  } catch {
    return [];
  }
}

export function saveEditorRevision(
  revision: Omit<EditorRevision, "id" | "createdAt">,
): EditorRevision | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = readEditorRevisions(
      revision.templateId,
      revision.category,
      revision.siteId,
    );
    const fingerprint = JSON.stringify({
      sections: revision.sections,
      pageLinks: revision.pageLinks,
      templateVariables: revision.templateVariables,
    });
    const latestFingerprint = existing[0]
      ? JSON.stringify({
          sections: existing[0].sections,
          pageLinks: existing[0].pageLinks,
          templateVariables: existing[0].templateVariables,
        })
      : "";

    if (fingerprint === latestFingerprint) return existing[0] ?? null;

    const createdAt = Date.now();
    const nextRevision: EditorRevision = {
      ...revision,
      id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt,
    };
    const next = [nextRevision, ...existing].slice(0, MAX_REVISIONS);

    localStorage.setItem(
      getRevisionKey(revision.templateId, revision.category, revision.siteId),
      JSON.stringify(next),
    );
    return nextRevision;
  } catch {
    return null;
  }
}
