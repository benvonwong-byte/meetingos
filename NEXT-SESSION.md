# MeetingOS: handoff

meeting.dearcrisis.com is this repo: a Vue client (`client/`, built into `backend/public/`) on Firebase Hosting, with one Cloud Function `api` (`functions/index.js`) in Firebase project `meetingos-vonwong`.

## 2026-11-17: sign-in through Arcos (branch `arcos-login`)

**Ben's ask:** "People that should be able to login into this tool should be anyone with an Arcos profile or who is on our Arcos database."

**What was wrong.** The login searched a legacy Airtable view (72 people, `Data Type` People or Participant) and checked the typed phone against Airtable's `Phone Contact`. Anyone added to the community since then, which now lives in Arcos, could not find their name.

**What changed.**

- `functions/index.js` has four relays to Arcos's own public door endpoints, the same ones beta.dearcrisis.com's sign-in uses, for space `dearcrisisnyc`: `GET /api/arcos/roster?q=` (name search, at most 8 names, 2 characters at least), `POST /api/arcos/options` (which ways in a profile offers, sends nothing), `POST /api/arcos/start` (Arcos texts or emails a 6-digit code to the contact on the profile), `POST /api/arcos/verify` (checks the code). They exist because Arcos sends no CORS headers for this origin. The Arcos session a correct code returns is never sent to the browser; the app only stores the name and the Arcos person id. These routes skip the MongoDB connection.
- `client/src/views/Login.vue`: find your name, then text or email a code (a choice when the profile has both), then the code. Text falls back to email the way beta's door does. Join mode (an event link) still offers "Join as guest".
- Who gets in: Arcos's roster answers for anyone on a Dear Crisis guest list plus any member holding a profile. A sample of 12 of the 72 Airtable names were all found in Arcos.
- `auth-bridge.html` (posts the stored identity to info.dearcrisis.com) moved to `client/public/` so builds stop deleting it.
- The first commit on the branch records what was already deployed but never committed (event-link join mode, date label fixes, how-it-works order, auth-bridge, `scripts/dedup-event.mjs`).

**Side effect to know.** Verifying a code goes through Arcos's claim flow, as on beta: someone whose profile has no account yet gets an Arcos account tied to that profile, and the email's link opens the community app. That is the same thing that happens when they sign in to beta.

**Checked.** Production build passes (`client`: `NODE_OPTIONS=--openssl-legacy-provider npx vue-cli-service build`). The real function ran locally behind a small harness: roster search, options (masked contacts, nothing sent), bad input refused, and a wrong code against Ben's own profile refused with Arcos's message. In the browser: name search, the text-or-email choice, the not-found state at 375 px. **Not checked:** a real code end to end (it would text or email a member).

**Known limits.**

- Every call reaches Arcos from Google's addresses, so Arcos's per-visitor limits (20 option lookups a minute, Supabase's code limits) count all MeetingOS visitors together. Fine at salon scale. If it bites, Arcos accepts a signed `X-Visitor-IP` (beta's `dcapp/worker/visitor.js`, secret `VISITOR_IP_SECRET`, which only Vincent can share).
- The profile panel (avatar button) still edits Airtable and only shows for old `rec…` ids. People signed in through Arcos see "Sign out" instead; their profile lives on beta.dearcrisis.com.
- `/api/participants` and `/api/verify` (the Airtable path) are left in place for browsers still running the old page; nothing new calls them.
- The dev server shows a pre-existing lint error in `NewEvent.vue` (`_windowOrder`, `vue/no-reserved-keys`); the production build ignores it.

## Waiting on Ben

1. **Deploy** (needs Ben's go-ahead). From the repo root on `arcos-login`:
   `firebase deploy --only hosting,functions:api --project meetingos-vonwong`
   Then sign in on meeting.dearcrisis.com with a real profile to confirm a code arrives and is accepted.
2. **Merge** the PR into `main` after the deploy is confirmed. Local `main` was 17 commits ahead of GitHub (the April profile and participant work); those are on this branch too.
