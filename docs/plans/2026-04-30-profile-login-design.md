# Design: Metacrisis Salon 9 Profile + Login

**Date:** 2026-04-30
**Status:** Approved

## Overview

Add Metacrisis Salon 9 branding to the login screen and a full profile editing panel for verified participants, with two-way Airtable sync.

## 1. Login Branding

Cosmetic update only — no auth flow changes.

- Replace "Dear Crisis" logo and name on `Login.vue` with "Metacrisis Salon 9" mark
- Auth flow unchanged: name search → phone verify
- No passkey UI (already behind a `localStorage` flag — never set it)
- Participant list sourced from Airtable Items table (Data Type = People, Space = metacrisis-nyc)

## 2. Participant Detection

- After login, `dc_record_id` in localStorage holds either:
  - An Airtable record ID (starts with `rec...`) — verified participant
  - A random alphanumeric string — guest
- Profile button rendered only when `dc_record_id.startsWith('rec')`

## 3. Profile Button (top-right nav)

- Small circular avatar showing initials or headshot photo
- Tapping opens the profile overlay panel

## 4. Profile Panel

Slide-in overlay matching the metacrisis9.dearcrisis.com UX:

- **Header**: logo + close (×) button
- **Photo**: circular avatar, tap to upload; opens crop modal (square source → round crop, 800px output)
- **Name**: single-line text input
- **Subtitle**: one-liner text input + privacy toggle (public by default)
- **Short Bio**: textarea (3 rows) + privacy toggle (public by default)
- **LinkedIn / website**: URL input + privacy toggle (public by default)
- **Contact section** (lock icon, "private by default"):
  - Email + privacy toggle
  - Phone + privacy toggle
- **Save Profile** button (explicit save, not auto-save) + loading/saved states
- **Log out** button

Privacy toggles store a JSON blob in an Airtable `Privacy Settings` field (same pattern as Catalist app).

## 5. Backend API (new routes in Firebase Functions)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/profile?recordId=` | Fetch participant record from Airtable Items table |
| PATCH | `/api/profile` | Update Title, Subtitle, Short Bio, Main Social Link/Website, Email Contact, Phone Contact, Hashtags, Privacy Settings |
| POST | `/api/upload-photo` | Accept base64 image from client; upload to Airtable Headshot attachment field |

## 6. Airtable

- **Base**: `appzCmN3k3ebyInIz` (Metacrisis NYC)
- **Table**: `tblpvnCFglIv3Uffy` (Items)
- **PAT**: stored as `CATALIST_PAT` in Firebase Secret Manager (same pattern as existing `AIRTABLE_PAT`)
- **Field mapping**:

| Profile field | Airtable field |
|--------------|----------------|
| Name | Title |
| Subtitle | Subtitle (to be added if missing) |
| Bio | Short Bio |
| LinkedIn / website | Main Social Link/Website |
| Email | Email Contact |
| Phone | Phone Contact |
| Tags | Hashtags |
| Photo | Headshot (attachment) |
| Privacy | Privacy Settings (JSON string) |

## Out of Scope

- Survey / matchmaking questions (Catalist-only feature)
- Guest profile editing
- Profile pages for viewing other participants
