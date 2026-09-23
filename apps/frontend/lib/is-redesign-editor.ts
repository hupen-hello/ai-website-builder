/** Shared redesign-editor detection (URL query or rd_ designId). */

export function isRedesignEditorSearchParams(
  searchParams: { get: (key: string) => string | null } | URLSearchParams | null | undefined,
): boolean {
  if (!searchParams) return false;
  if (searchParams.get("redesign") === "1") return true;
  const designId = (searchParams.get("designId") || "").trim();
  return designId.startsWith("rd_");
}
