// Admin session — stores admin credentials locally so RPCs can re-verify.
// Custom login model has no JWT, so each admin RPC receives pass_id + password.

const KEY = "bunker.admin_session";

export interface AdminSession {
  passId: string;
  password: string;
}

export function setAdminSession(s: AdminSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
