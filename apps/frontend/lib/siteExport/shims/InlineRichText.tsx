type InlineRichTextProps = {
  value: string;
  formatKey?: string;
  legacyOccurrence?: number;
};

/** Read-only export shim — renders plain saved text without editor formatting context. */
export default function InlineRichText({ value }: InlineRichTextProps) {
  return value;
}
