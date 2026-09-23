import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  AirVent,
  Ambulance,
  ArrowUpDown,
  Baby,
  Bath,
  BedDouble,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Cable,
  Camera,
  Car,
  Cat,
  CheckCircle2,
  CigaretteOff,
  Clock,
  CloudRain,
  Coffee,
  ConciergeBell,
  CookingPot,
  Dog,
  DoorOpen,
  Droplets,
  Dumbbell,
  Fence,
  FerrisWheel,
  Flame,
  Flower2,
  Gamepad2,
  Gauge,
  Gift,
  Glasses,
  GraduationCap,
  Hammer,
  HeartPulse,
  Heater,
  Home,
  Hospital,
  Hotel,
  KeyRound,
  Lamp,
  Landmark,
  Leaf,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  Microwave,
  Mountain,
  Music,
  Package,
  ParkingCircle,
  PawPrint,
  Phone,
  Pill,
  Plug,
  Presentation,
  Refrigerator,
  School,
  Shield,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShowerHead,
  Sofa,
  Sparkles,
  Speaker,
  Store,
  Sun,
  SwatchBook,
  Theater,
  Thermometer,
  Toilet,
  TrainFront,
  Trash2,
  Trees,
  Trophy,
  Tv,
  Umbrella,
  Users,
  UtensilsCrossed,
  Volleyball,
  Warehouse,
  WashingMachine,
  Watch,
  Waves,
  Wifi,
  Wind,
  Wine,
  Zap,
} from "lucide-react";

export type PropertyAmenity = {
  name: string;
  icon: string;
};

export type PropertyAmenityOption = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

/** Preset amenity icons shown in the property editor picker. */
export const PROPERTY_AMENITY_OPTIONS: PropertyAmenityOption[] = [
  { id: "zap", label: "Power Back-Up", Icon: Zap },
  { id: "plug", label: "Electricity", Icon: Plug },
  { id: "waves", label: "Swimming Pool", Icon: Waves },
  { id: "dumbbell", label: "Gym / Fitness", Icon: Dumbbell },
  { id: "volleyball", label: "Sports Court", Icon: Volleyball },
  { id: "trophy", label: "Club Sports", Icon: Trophy },
  { id: "car", label: "Covered Parking", Icon: Car },
  { id: "parking", label: "Open Parking", Icon: ParkingCircle },
  { id: "bus", label: "Shuttle Service", Icon: Bus },
  { id: "train", label: "Near Metro / Rail", Icon: TrainFront },
  { id: "shield", label: "24x7 Security", Icon: Shield },
  { id: "shield-check", label: "Gated Security", Icon: ShieldCheck },
  { id: "camera", label: "CCTV", Icon: Camera },
  { id: "lock", label: "Smart Lock", Icon: Lock },
  { id: "key", label: "Gated Community", Icon: KeyRound },
  { id: "fence", label: "Boundary Wall", Icon: Fence },
  { id: "lift", label: "Lift / Elevator", Icon: ArrowUpDown },
  { id: "accessibility", label: "Wheelchair Access", Icon: Accessibility },
  { id: "wifi", label: "Wi-Fi", Icon: Wifi },
  { id: "cable", label: "Cable TV", Icon: Cable },
  { id: "tv", label: "Television", Icon: Tv },
  { id: "speaker", label: "Home Theatre", Icon: Speaker },
  { id: "wind", label: "Air Conditioning", Icon: Wind },
  { id: "air-vent", label: "Central AC / Vent", Icon: AirVent },
  { id: "heater", label: "Heating", Icon: Heater },
  { id: "thermometer", label: "Climate Control", Icon: Thermometer },
  { id: "trees", label: "Garden / Lawn", Icon: Trees },
  { id: "flower", label: "Landscaping", Icon: Flower2 },
  { id: "leaf", label: "Eco Friendly", Icon: Leaf },
  { id: "mountain", label: "Hill / Nature View", Icon: Mountain },
  { id: "sun", label: "Terrace / Deck", Icon: Sun },
  { id: "umbrella", label: "Rain Shelter", Icon: Umbrella },
  { id: "cloud-rain", label: "Rain Water Harvesting", Icon: CloudRain },
  { id: "droplets", label: "Water Supply", Icon: Droplets },
  { id: "home", label: "Club House", Icon: Home },
  { id: "building", label: "Community Hall", Icon: Building2 },
  { id: "hotel", label: "Guest Rooms", Icon: Hotel },
  { id: "warehouse", label: "Store Room", Icon: Warehouse },
  { id: "landmark", label: "Landmark Nearby", Icon: Landmark },
  { id: "map-pin", label: "Prime Location", Icon: MapPin },
  { id: "utensils", label: "Restaurant / Cafe", Icon: UtensilsCrossed },
  { id: "coffee", label: "Coffee Shop", Icon: Coffee },
  { id: "wine", label: "Bar / Lounge", Icon: Wine },
  { id: "cooking", label: "Modular Kitchen", Icon: CookingPot },
  { id: "microwave", label: "Microwave", Icon: Microwave },
  { id: "refrigerator", label: "Refrigerator", Icon: Refrigerator },
  { id: "bath", label: "Spa / Jacuzzi", Icon: Bath },
  { id: "shower", label: "Attached Bathroom", Icon: ShowerHead },
  { id: "toilet", label: "Western Toilet", Icon: Toilet },
  { id: "sofa", label: "Furnished", Icon: Sofa },
  { id: "bed", label: "Bedroom Ready", Icon: BedDouble },
  { id: "lamp", label: "Intercom", Icon: Lamp },
  { id: "lightbulb", label: "Lighting", Icon: Lightbulb },
  { id: "phone", label: "Telephone Line", Icon: Phone },
  { id: "mail", label: "Mail Box", Icon: Mail },
  { id: "bike", label: "Cycle Track", Icon: Bike },
  { id: "flame", label: "Gas Pipeline", Icon: Flame },
  { id: "shirt", label: "Laundry", Icon: Shirt },
  { id: "washing", label: "Washing Machine", Icon: WashingMachine },
  { id: "sparkles", label: "Housekeeping", Icon: Sparkles },
  { id: "trash", label: "Waste Disposal", Icon: Trash2 },
  { id: "concierge", label: "Concierge", Icon: ConciergeBell },
  { id: "door", label: "Service Entrance", Icon: DoorOpen },
  { id: "clock", label: "24 Hour Access", Icon: Clock },
  { id: "watch", label: "Visitor Timing", Icon: Watch },
  { id: "users", label: "Visitor Lounge", Icon: Users },
  { id: "paw", label: "Pet Friendly", Icon: PawPrint },
  { id: "dog", label: "Pet Park", Icon: Dog },
  { id: "cat", label: "Indoor Pets", Icon: Cat },
  { id: "baby", label: "Kids Play Area", Icon: Baby },
  { id: "ferris", label: "Amusement / Play", Icon: FerrisWheel },
  { id: "gamepad", label: "Indoor Games", Icon: Gamepad2 },
  { id: "music", label: "Music Room", Icon: Music },
  { id: "theater", label: "Amphitheatre", Icon: Theater },
  { id: "book", label: "Library", Icon: BookOpen },
  { id: "school", label: "Near School", Icon: School },
  { id: "graduation", label: "Near College", Icon: GraduationCap },
  { id: "hospital", label: "Near Hospital", Icon: Hospital },
  { id: "heart-pulse", label: "Medical Center", Icon: HeartPulse },
  { id: "ambulance", label: "Emergency Care", Icon: Ambulance },
  { id: "pill", label: "Pharmacy Nearby", Icon: Pill },
  { id: "shopping", label: "Shopping Mall", Icon: ShoppingBag },
  { id: "store", label: "Convenience Store", Icon: Store },
  { id: "briefcase", label: "Business Center", Icon: Briefcase },
  { id: "presentation", label: "Conference Room", Icon: Presentation },
  { id: "package", label: "Package Room", Icon: Package },
  { id: "gauge", label: "High Speed Lift", Icon: Gauge },
  { id: "hammer", label: "Maintenance", Icon: Hammer },
  { id: "gift", label: "Amenities Pack", Icon: Gift },
  { id: "glasses", label: "Reading Room", Icon: Glasses },
  { id: "swatch", label: "Design Studio", Icon: SwatchBook },
  { id: "cigarette-off", label: "No Smoking", Icon: CigaretteOff },
  { id: "check", label: "Other", Icon: CheckCircle2 },
];

const OPTION_BY_ID = new Map(
  PROPERTY_AMENITY_OPTIONS.map((option) => [option.id, option]),
);

export const DEFAULT_PROPERTY_AMENITY_ICON = "zap";

export const getPropertyAmenityOption = (iconId?: string | null) =>
  OPTION_BY_ID.get((iconId || "").trim()) ||
  OPTION_BY_ID.get(DEFAULT_PROPERTY_AMENITY_ICON)!;

export const getPropertyAmenityIcon = (iconId?: string | null): LucideIcon =>
  getPropertyAmenityOption(iconId).Icon;

const normalizeAmenity = (value: unknown): PropertyAmenity | null => {
  if (typeof value === "string") {
    const name = value.trim();
    if (!name) return null;
    return { name, icon: DEFAULT_PROPERTY_AMENITY_ICON };
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name =
    typeof record.name === "string"
      ? record.name.trim()
      : typeof record.label === "string"
        ? record.label.trim()
        : "";
  if (!name) return null;
  const icon =
    typeof record.icon === "string" && record.icon.trim()
      ? record.icon.trim()
      : DEFAULT_PROPERTY_AMENITY_ICON;
  return { name, icon };
};

/**
 * Accepts legacy comma-separated strings, JSON strings, or amenity objects.
 */
export const parsePropertyAmenities = (value: unknown): PropertyAmenity[] => {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value
      .map(normalizeAmenity)
      .filter((item): item is PropertyAmenity => Boolean(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (Array.isArray(parsed)) return parsePropertyAmenities(parsed);
      } catch {
        // Fall through to comma-separated parsing.
      }
    }

    return trimmed
      .split(",")
      .map((item) => normalizeAmenity(item))
      .filter((item): item is PropertyAmenity => Boolean(item));
  }

  return [];
};

export const serializePropertyAmenities = (
  amenities: PropertyAmenity[],
): PropertyAmenity[] =>
  amenities
    .map((item) => ({
      name: item.name.trim(),
      icon: item.icon.trim() || DEFAULT_PROPERTY_AMENITY_ICON,
    }))
    .filter((item) => item.name);
