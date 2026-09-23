export type CustomSectionLayoutId =
  | "single"
  | "two-columns"
  | "two-rows"
  | "three-columns"
  | "three-rows"
  | "left-wide-right-stack"
  | "top-wide-bottom-split"
  | "top-split-bottom-wide"
  | "four-columns"
  | "four-grid"
  | "five-columns"
  | "six-columns"
  | "left-stack-right-wide";

export type CustomSectionLayout = {
  id: CustomSectionLayoutId;
  label: string;
  cellCount: number;
  columns: string;
  rows: string;
  areas: string;
};

export const CUSTOM_SECTION_LAYOUTS: CustomSectionLayout[] = [
  { id: "single", label: "Single column", cellCount: 1, columns: "1fr", rows: "auto", areas: '"a"' },
  { id: "two-columns", label: "Two columns", cellCount: 2, columns: "repeat(2, 1fr)", rows: "auto", areas: '"a b"' },
  { id: "two-rows", label: "Two rows", cellCount: 2, columns: "1fr", rows: "repeat(2, auto)", areas: '"a" "b"' },
  { id: "three-columns", label: "Three columns", cellCount: 3, columns: "repeat(3, 1fr)", rows: "auto", areas: '"a b c"' },
  { id: "three-rows", label: "Three rows", cellCount: 3, columns: "1fr", rows: "repeat(3, auto)", areas: '"a" "b" "c"' },
  { id: "left-wide-right-stack", label: "Left wide + stack", cellCount: 3, columns: "repeat(2, 1fr)", rows: "repeat(2, auto)", areas: '"a b" "a c"' },
  { id: "top-wide-bottom-split", label: "Top wide + split", cellCount: 3, columns: "repeat(2, 1fr)", rows: "repeat(2, auto)", areas: '"a a" "b c"' },
  { id: "top-split-bottom-wide", label: "Top split + wide", cellCount: 3, columns: "repeat(2, 1fr)", rows: "repeat(2, auto)", areas: '"a b" "c c"' },
  { id: "four-columns", label: "Four columns", cellCount: 4, columns: "repeat(4, 1fr)", rows: "auto", areas: '"a b c d"' },
  { id: "four-grid", label: "Four grid", cellCount: 4, columns: "repeat(2, 1fr)", rows: "repeat(2, auto)", areas: '"a b" "c d"' },
  { id: "five-columns", label: "Five columns", cellCount: 5, columns: "repeat(5, 1fr)", rows: "auto", areas: '"a b c d e"' },
  { id: "six-columns", label: "Six columns", cellCount: 6, columns: "repeat(6, 1fr)", rows: "auto", areas: '"a b c d e f"' },
  { id: "left-stack-right-wide", label: "Stack + right wide", cellCount: 3, columns: "repeat(2, 1fr)", rows: "repeat(2, auto)", areas: '"a b" "c b"' },
];

export const getCustomSectionLayout = (layoutId?: string) =>
  CUSTOM_SECTION_LAYOUTS.find((layout) => layout.id === layoutId);

export const layoutIdForColumnCount = (count: number): CustomSectionLayoutId => {
  if (count <= 1) return "single";
  if (count === 2) return "two-columns";
  if (count === 3) return "three-columns";
  if (count === 4) return "four-columns";
  if (count === 5) return "five-columns";
  return "six-columns";
};
