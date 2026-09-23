import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export default function BrandLogo({
  compact = false,
  inverse = false,
  className = "",
}: BrandLogoProps) {
  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      <Image
        src="/lestow.png"
        alt="Lestow AI Website Builder"
        width={compact ? 42 : 146}
        height={compact ? 42 : 46}
        priority
        className={`${compact ? "size-[42px]" : "h-[46px] w-[146px]"} object-contain ${inverse ? "brightness-0 invert" : ""}`}
      />
    </span>
  );
}
