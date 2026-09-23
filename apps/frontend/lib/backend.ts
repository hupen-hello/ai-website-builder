const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
export const USER_TOKEN_COOKIE = "user_token";

export function getBackendUrl() {
  return BACKEND_URL;
}
