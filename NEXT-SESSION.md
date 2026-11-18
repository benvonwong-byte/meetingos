# MeetingOS: handoff

meeting.dearcrisis.com is this repo: a Vue client (`client/`, built into `backend/public/`) on Firebase Hosting, with one Cloud Function `api` (`functions/index.js`) in Firebase project `meetingos-vonwong`.

On branch `meeting-in-beta` (2026-11-18) it is served at **beta.dearcrisis.com/meeting/** by beta's Worker instead, and meeting.dearcrisis.com only forwards there (`redirect-worker/`).

## 2026-11-18: inside beta at /meeting/, one sign-in with the app (branch `meeting-in-beta`, NOT deployed)

**Ben's ask:** "can you integrate meeting.dearcrisis.com into the beta.dearcrisis.com ecosystem (ie. single sign in, profiles load the same, etc...) but it acts as an "unlisted" link for now?"

**Why the address changes.** Beta's sign-in is the Arcos session kept in the browser under `sb-xxmupzmqaslohbonsvpi-auth-token`, and a browser keeps that per address. At meeting.dearcrisis.com this app could never see it, so beta's Worker serves it at `beta.dearcrisis.com/meeting/` (branch `meeting-in-beta` of benvonwong-byte/arcos-dearcrisis, `meetingProxy` and `/api/dc-me` in `dcapp/worker/worker.js`; its NEXT-SESSION.md has the beta half).

**What changed here:**

- `client/vue.config.js` builds for `publicPath: "/meeting/"`. Every file, route and API call is under it: `/meeting/api/...` reaches this repo's `api` function through beta's Worker. The build in `backend/public/` is that build, so it no longer works at the root of meetingos-vonwong.web.app.
- `client/src/dcSession.ts` (new): reads beta's session (never renews it, never sends it anywhere but beta's own `/api/dc-me`), and keeps the member's name, Arcos person id, photo and profile path as `dc_user_name`, `dc_record_id`, `dc_person_photo`, `dc_person_profile`, with `dc_signed_in_via = "dearcrisis"`.
- `client/src/router/index.ts`: once per page load, a fresh beta session signs the member in here; a stale one goes through the app once a minute at most (beta renews it and sends them straight back); signed out on beta means signed out here. A guest who joined by name is left alone.
- `client/src/views/Login.vue`: one "Sign in with Dear Crisis" button that keeps this page in `dc-after-signin` and opens beta's door at `/#door`; the door brings them back. On an event link the guest name box stays. The roster search and code steps are gone from the client. Branding is "Dear Crisis · Community Scheduling" (it said Metacrisis Salon 9).
- `client/src/App.vue`: a member's avatar opens a small menu: their photo or initials, "Your profile on Dear Crisis" (`/person/<appId>` on beta), "Open the Dear Crisis app", and Sign out, which clears this app and the app's session on the device (one sign-in, one sign-out). Old Airtable `rec…` participants still get ProfilePanel.
- `client/public/index.html`: title "Meeting planner · Dear Crisis" and `noindex, nofollow`.
- `redirect-worker/` (new, the Worker `dear-crisis-meeting` on meeting.dearcrisis.com): a 302 to `https://beta.dearcrisis.com/meeting<path><query>`. Its source had never been in git; `~/Dropbox/ClaudeCode/meeting-worker` is now a copy with a README pointing here.

**Left in place on purpose:** the four `/api/arcos/*` relays in `functions/index.js` (nothing calls them now), and `/api/participants`, `/api/verify`, `/api/profile` for old browsers and old participants.

**Checked locally** against a stand-in for beta (session scratchpad, not in the repo) with the real Firebase function behind `/meeting/api/`: the signed-out login; "Sign in with Dear Crisis" leaving `/meeting/event/<id>` for beta's door; a fresh session signing in with no screen; the member menu and its links; sign-out clearing both sessions; an expired session going through the app once, then staying put inside the minute; a guest joining an event by name; event reads going to `/meeting/api/events/<id>`. Build passes. Lint: 210 Prettier warnings repo-wide before, `App.vue` 25 to 55 from the new template lines (left as the file's own style).

**Not checked:** a real member signing in end to end on beta, which needs both deploys.

**Known limit, unchanged:** availability on an event is still keyed by the name shown, as in when2meet, so a guest could type a member's name. Members now arrive with the app's name, but nothing stops the guest box. Tying a member's answers to their Arcos id is the next step if Ben wants it.

**Deploy order (needs Ben's go-ahead):** 1. merge beta's `meeting-in-beta` into `dc-layout2` and let it deploy. 2. Here, from `meeting-in-beta`: `firebase deploy --only hosting --project meetingos-vonwong`. 3. `cd redirect-worker && npx wrangler deploy`. Run 2 and 3 back to back: between them meeting.dearcrisis.com still proxies to a build made for `/meeting/` and shows a broken page.

## 2026-11-18: deployed, the Arcos login is live

Ben gave the go-ahead and `firebase deploy --only hosting,functions:api --project meetingos-vonwong` ran from `arcos-login`. The `api` function updated (Node 22, 2nd gen, us-central1) and hosting released.

Verified on meeting.dearcrisis.com straight after:

- `GET /api/arcos/roster?q=von` answers 200 with real Arcos people, so the relay reaches Arcos from Google's addresses as intended.
- The shipped bundle `js/app.1ffbbfdc.js` calls only `/api/arcos/roster`, `/api/arcos/options`, `/api/arcos/start` and `/api/arcos/verify`. No Airtable call is left in the client.
- `/api/participants` still answers 200, left in place for browsers holding the old cached page.

Still unproven: a correct 6-digit code end to end. Testing it means Arcos texting or emailing a real person, so Ben signs in with his own profile once to close it out.

**Wider ask, same day.** Ben asked for an audit of every tool we have built and for all of their logins to move to Arcos, the way beta.dearcrisis.com and now MeetingOS work. That work is tracked outside this repo; anything MeetingOS-specific lands here.

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

1. ~~**Deploy**~~ Done 2026-11-18, see the section above.
2. **Sign in once on the live site** with your own profile, to prove a correct code arrives and is accepted. Nobody has done this yet.
3. **Merge** `arcos-login` into `main` (needs Ben's go-ahead). Local `main` was 17 commits ahead of GitHub (the April profile and participant work); those are on this branch too.
4. **Decide the Airtable cleanup.** `/api/participants` and `/api/verify` are dead to the client but still answer, and the profile panel still writes to Airtable for old `rec…` ids. Ben has not said whether to strip them or keep them as the safety net.
