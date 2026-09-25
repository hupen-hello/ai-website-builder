import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  ArrowRight,
  Award,
  BadgeCheck,
  Biohazard,
  Brush,
  Building,
  Building2,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Droplets,
  FileText,
  Handshake,
  Headset,
  Heart,
  Home,
  House,
  Key,
  Eye,
  Leaf,
  Mail,
  MapPin,
  MessageSquareText,
  PaintRoller,
  PartyPopper,
  PhoneCall,
  Quote,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SprayCan,
  Star,
  Target,
  ThumbsUp,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";

export const WEBSITE_ICON_OPTIONS = [
  "Users",
  "ThumbsUp",
  "ClipboardCheck",
  "Award",
  "PartyPopper",
  "PaintRoller",
  "AppWindow",
  "House",
  "Biohazard",
  "Headset",
  "MessageSquareText",
  "ClipboardList",
  "Home",
  "Key",
  "Eye",
  "SprayCan",
  "Sparkles",
  "Search",
  "Quote",
  "Check",
  "CheckCircle2",
  "XCircle",
  "ArrowRight",
  "PhoneCall",
  "MapPin",
  "Mail",
  "Smartphone",
  "Star",
  "Heart",
  "Clock",
  "ShieldCheck",
  "Brush",
  "Droplets",
  "Leaf",
  "Wrench",
  "Building",
  "Building2",
  "BarChart3",
  "BadgeCheck",
  "Handshake",
  "Calendar",
  "FileText",
  "Target",
  "TrendingUp",
  "UserCheck",
] as const;

const ICON_COMPONENTS: LucideIcon[] = [
  Users,
  ThumbsUp,
  ClipboardCheck,
  Award,
  PartyPopper,
  PaintRoller,
  AppWindow,
  House,
  Biohazard,
  Headset,
  MessageSquareText,
  ClipboardList,
  Home,
  Key,
  Eye,
  SprayCan,
  Sparkles,
  Search,
  Quote,
  Check,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PhoneCall,
  MapPin,
  Mail,
  Smartphone,
  Star,
  Heart,
  Clock,
  ShieldCheck,
  Brush,
  Droplets,
  Leaf,
  Wrench,
  Building,
  Building2,
  BarChart3,
  BadgeCheck,
  Handshake,
  Calendar,
  FileText,
  Target,
  TrendingUp,
  UserCheck,
];

export const toLucideIconName = (value: string) =>
  value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

export const toKebabIconName = (value: string) =>
  toLucideIconName(value).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const ICON_LOOKUP: Record<string, LucideIcon> = {};

WEBSITE_ICON_OPTIONS.forEach((pascal, index) => {
  const component = ICON_COMPONENTS[index];
  ICON_LOOKUP[pascal] = component;
  ICON_LOOKUP[pascal.toLowerCase()] = component;
  ICON_LOOKUP[toKebabIconName(pascal)] = component;
});

export const isIconFieldName = (fieldName: string) =>
  /^(icon|iconname|mainicon|subicon)$/i.test(fieldName);

export const isSvgIconValue = (value: string) =>
  /<svg[\s>]/i.test(value) ||
  /^data:image\/svg/i.test(value.trim()) ||
  /\.svg(\?|#|$)/i.test(value.trim());

export function getLucideIcon(
  name: string,
  fallback: LucideIcon = Users,
): LucideIcon {
  if (!name || isSvgIconValue(name)) return fallback;

  return (
    ICON_LOOKUP[name] ||
    ICON_LOOKUP[toLucideIconName(name)] ||
    ICON_LOOKUP[toKebabIconName(name)] ||
    fallback
  );
}

export function formatIconLabel(name: string) {
  const pascal = toLucideIconName(name);
  return pascal.replace(/([A-Z])/g, " $1").trim() || name;
}

type WebsiteIconProps = {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

export function WebsiteIcon({
  name,
  size = 24,
  className,
  strokeWidth = 1.5,
  style,
}: WebsiteIconProps) {
  const value = String(name || "");

  if (/<svg[\s>]/i.test(value)) {
    return (
      <span
        className={`inline-flex items-center justify-center [&>svg]:h-full [&>svg]:w-full ${className ?? ""}`}
        style={{ width: size, height: size, ...style }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  if (/^data:image\/svg/i.test(value) || /\.svg(\?|#|$)/i.test(value)) {
    return (
      <img
        src={value}
        alt=""
        width={size}
        height={size}
        className={className}
        style={style}
      />
    );
  }

  const Icon = getLucideIcon(value);
  return (
    <Icon
      size={size}
      className={className}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
}
