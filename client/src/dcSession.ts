// MeetingOS inside the Dear Crisis app (Ben, 2026-11-18: "integrate meeting.dearcrisis.com into the
// beta.dearcrisis.com ecosystem (ie. single sign in, profiles load the same, etc...) but it acts as an
// 'unlisted' link for now").
//
// This app is served at beta.dearcrisis.com/meeting/ by beta's own Worker, so it shares beta's origin and
// with it the app's sign-in: the Arcos session that beta's door stores in this browser. Nothing here signs
// anyone in by itself any more. A member is whoever beta says they are (/api/dc-me, answered from that
// session), with the same name, photo and profile page the app shows. A guest joining an event by name is
// unchanged and never touches any of this.
//
// Two rules:
//   - this file only ever READS beta's session. Renewing it is beta's job: an expired one sends the visitor
//     through the app, which renews it as it opens and sends them straight back (dcapp/core/94-router.js).
//     Two apps renewing one session would each spend the other's refresh token.
//   - the session goes to beta's own /api/dc-me and nowhere else. MeetingOS's API on Firebase never sees it.

const SESSION_KEY = "sb-xxmupzmqaslohbonsvpi-auth-token"; // Arcos's Supabase project, as beta's bridge keeps it
const AFTER = "dc-after-signin"; // beta's router reads this after its sign-in (dcapp/core/94-router.js)
const BOUNCED = "meeting-renew-at";

export const BASE: string = process.env.BASE_URL || "/";

// this app's own API, under /meeting/api/ on beta (forwarded to Firebase as /api/)
export const api = (path: string): string =>
  `${BASE}api/${path.replace(/^\/+/, "")}`;

// where the visitor is, as a whole path on beta's origin
export const herePath = (fullPath: string): string =>
  `${BASE.replace(/\/$/, "")}${fullPath || "/"}`;

type Stored = { access_token?: string; expires_at?: number };
const stored = (): Stored | null => {
  try {
    const v = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return v && typeof v === "object" ? (v as Stored) : null;
  } catch {
    return null;
  }
};

// "fresh" with half a minute to spare, so a check never races the token's own end
export const sessionState = (): "none" | "fresh" | "stale" => {
  const s = stored();
  if (!s || !s.access_token) return "none";
  const exp = Number(s.expires_at || 0) * 1000;
  return exp > Date.now() + 30000 ? "fresh" : "stale";
};

export type Me = {
  person: string;
  app: string;
  name: string;
  photo: string;
  profile: string;
};

export async function readMe(): Promise<Me | null> {
  const s = stored();
  if (!s || !s.access_token) return null;
  try {
    const r = await fetch("/api/dc-me", {
      headers: { authorization: `Bearer ${s.access_token}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const me = await r.json();
    return me && typeof me.person === "string" && me.person ? (me as Me) : null;
  } catch {
    return null;
  }
}

const KEYS = [
  "dc_user_name",
  "dc_record_id",
  "dc_person_photo",
  "dc_person_profile",
  "dc_signed_in_via",
];

export const viaDearCrisis = (): boolean =>
  localStorage.getItem("dc_signed_in_via") === "dearcrisis";

// Someone the base has not caught up with yet (it rebuilds every 15 minutes) comes back with no name: the
// name this browser already had is kept, else a plain word, until the next visit fills it in
export function applyMe(me: Me): void {
  const name =
    (me.name || "").trim() ||
    localStorage.getItem("dc_user_name") ||
    "Dear Crisis member";
  localStorage.setItem("dc_user_name", name);
  localStorage.setItem("dc_record_id", me.person);
  localStorage.setItem("dc_person_photo", me.photo || "");
  localStorage.setItem("dc_person_profile", me.profile || "");
  localStorage.setItem("dc_signed_in_via", "dearcrisis");
}

// Signing out here signs out of the app too: one sign-in, one sign-out. This removes the session from this
// browser, as the app's own sign-out does for the device.
export function forgetMe(alsoDearCrisis: boolean): void {
  for (const k of KEYS) localStorage.removeItem(k);
  if (alsoDearCrisis) localStorage.removeItem(SESSION_KEY);
}

// Keep this page for after beta's sign-in, then open beta's door
export function signInWithDearCrisis(fullPath: string): void {
  try {
    sessionStorage.setItem(AFTER, herePath(fullPath));
  } catch {
    /* they start from the app's home once signed in */
  }
  location.href = "/#door";
}

// An expired session: through the app once a minute at most, so a session beta cannot renew never loops.
// False means stay here and treat the visitor as signed out.
export function renewThroughApp(fullPath: string): boolean {
  try {
    const at = Number(sessionStorage.getItem(BOUNCED) || 0);
    if (Date.now() - at < 60000) return false;
    sessionStorage.setItem(BOUNCED, String(Date.now()));
    sessionStorage.setItem(AFTER, herePath(fullPath));
  } catch {
    return false;
  }
  location.replace("/");
  return true;
}
