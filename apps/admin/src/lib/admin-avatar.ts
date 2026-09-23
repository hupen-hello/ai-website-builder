const AVATAR_KEY = 'admin_avatar_url';
const NAME_KEY = 'admin_display_name';
const EMAIL_KEY = 'admin_display_email';
export const DEFAULT_AVATAR = '/images/profile/user-1.jpg';

export function getCachedAvatar(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(AVATAR_KEY);
}

export function setCachedAvatar(url: string | null | undefined) {
  if (typeof window === 'undefined') return;
  const value = url || DEFAULT_AVATAR;
  sessionStorage.setItem(AVATAR_KEY, value);
}

export function getCachedAdminMeta() {
  if (typeof window === 'undefined') {
    return { name: null as string | null, email: null as string | null };
  }
  return {
    name: sessionStorage.getItem(NAME_KEY),
    email: sessionStorage.getItem(EMAIL_KEY),
  };
}

export function setCachedAdminMeta(name?: string | null, email?: string | null) {
  if (typeof window === 'undefined') return;
  if (name) sessionStorage.setItem(NAME_KEY, name);
  if (email) sessionStorage.setItem(EMAIL_KEY, email);
}

export function clearCachedAdmin() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AVATAR_KEY);
  sessionStorage.removeItem(NAME_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
}

export function resolveAvatarUrl(url?: string | null) {
  return url || DEFAULT_AVATAR;
}
