import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Mail, Phone, Plus } from "lucide-react";
import type { ButtonBlock as ButtonBlockData } from "../types/section";
import InlineRichText from "../../builder/InlineRichText";

type ButtonBlockProps = {
  block: ButtonBlockData;
  className?: string;
};

export default function ButtonBlock({ block, className }: ButtonBlockProps) {
  const formatKey = `block:${block.id}:label`;
  const Icon =
    block.icon === "arrow-left"
      ? ArrowLeft
      : block.icon === "plus"
        ? Plus
        : block.icon === "phone"
          ? Phone
          : block.icon === "mail"
            ? Mail
            : block.icon === "external-link"
              ? ExternalLink
              : block.icon === "arrow-right"
                ? ArrowRight
                : null;
  const icon = Icon ? <Icon aria-hidden="true" className="h-[1em] w-[1em] shrink-0" /> : null;

  return (
    <Link
      href={block.href}
      className={`inline-flex items-center gap-2 ${className ?? ""}`}
      data-editor-inline-format-key={formatKey}
      target={block.openInNewTab ? "_blank" : undefined}
      rel={block.openInNewTab ? "noopener noreferrer" : undefined}
    >
      {block.iconPosition === "before" ? icon : null}
      <InlineRichText value={block.label} formatKey={formatKey} />
      {block.iconPosition !== "before" ? icon : null}
    </Link>
  );
}
