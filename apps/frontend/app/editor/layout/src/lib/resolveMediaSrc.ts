const TEMPLATE4_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8b95fdaa0c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80",
] as const;

const needsTemplate4Fallback = (src: string) =>
  src.includes("/categories/realestate/template4/") ||
  src.includes("/images/placeholder") ||
  src.includes("/images/logos/logo");

const hashSrc = (src: string) => {
  let hash = 0;
  for (let index = 0; index < src.length; index += 1) {
    hash = (hash * 31 + src.charCodeAt(index)) >>> 0;
  }
  return hash;
};

export function resolveMediaSrc(src?: unknown, fallbackIndex = 0): string {
  const value = typeof src === "string" ? src.trim() : "";
  if (!value) {
    return TEMPLATE4_IMAGE_POOL[fallbackIndex % TEMPLATE4_IMAGE_POOL.length];
  }
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (!needsTemplate4Fallback(value)) return value;
  return TEMPLATE4_IMAGE_POOL[hashSrc(value) % TEMPLATE4_IMAGE_POOL.length];
}
