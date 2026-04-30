# Metacrisis Salon 9 Profile + Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Metacrisis Salon 9 login branding and a slide-in profile editing panel for verified participants, with two-way Airtable sync.

**Architecture:** The existing login flow (name search → phone verify) uses `AIRTABLE_PAT` + DearCrisis Airtable base (`appLtX5g0cVrAlLkl`). After login, `dc_record_id` in `localStorage` is the Airtable record ID for participants (starts with `rec`) or a random string for guests. A new `ProfilePanel.vue` mounts as a full-screen overlay inside `App.vue`, communicating via local reactive state. Three new routes in `functions/index.js` handle profile fetch, update, and photo upload against the same DearCrisis base. Privacy preferences are stored locally in `localStorage` (no Airtable schema changes required).

**Tech Stack:** Vue 3, Vuex 4, Firebase Functions Node 22, Express, Airtable REST + Content API, `cropperjs` (vanilla JS, no framework wrapper)

---

## Task 1: Login branding — Metacrisis Salon 9

**Files:**
- Modify: `client/src/views/Login.vue`

No functional change. Visual rebrand only.

**Step 1: Update brand text in `Login.vue`**

Find and replace these three display strings (lines ~6–9):

```html
<!-- FROM -->
<img src="/pigeon-logo.svg" alt="Dear Crisis" class="pigeon-logo" />
<div class="brand-name">Dear Crisis</div>
<div class="brand-sub">Community Scheduling Assistant</div>

<!-- TO -->
<img src="/pigeon-logo.svg" alt="Metacrisis Salon" class="pigeon-logo" />
<div class="brand-name">Metacrisis Salon 9</div>
<div class="brand-sub">Community Scheduling</div>
```

Also update the footer at line ~111:

```html
<!-- FROM -->
<p class="login-footer">Powered by <span class="footer-brand">Dear Crisis</span></p>

<!-- TO -->
<p class="login-footer">Powered by <span class="footer-brand">Dear Crisis</span> · Metacrisis Salon 9</p>
```

**Step 2: Build and visually verify**

```bash
cd client && npm run build
```

Open `http://localhost:8080/login` — confirm branding shows "Metacrisis Salon 9".

**Step 3: Commit**

```bash
git add client/src/views/Login.vue
git commit -m "feat: rebrand login to Metacrisis Salon 9"
```

---

## Task 2: Backend — airtable helpers + GET /api/profile

**Files:**
- Modify: `functions/index.js`

The existing `airtableFetch` only does GET. Add a `airtableRequest` helper that handles GET/PATCH/POST with optional body, then add the profile fetch route.

**Step 1: Add `airtableRequest` helper in `functions/index.js` after the existing `airtableFetch` function**

```js
function airtableRequest(method, path, pat, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.airtable.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${pat}`,
        ...(bodyStr && {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyStr),
        }),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}
```

**Step 2: Add GET /api/profile route in `functions/index.js` (before the MongoDB section)**

```js
app.get("/api/profile", async (req, res) => {
  const { recordId } = req.query;
  if (!recordId || !recordId.startsWith("rec")) {
    return res.status(400).json({ error: "Invalid recordId" });
  }
  try {
    const pat = process.env.AIRTABLE_PAT;
    const { body } = await airtableRequest(
      "GET",
      `/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${encodeURIComponent(recordId)}`,
      pat
    );
    if (body.error) return res.status(404).json({ error: "Record not found" });
    const f = body.fields || {};
    const headshotArr = f.Headshot || [];
    res.json({
      id: body.id,
      name: f.Title || "",
      subtitle: f.Subtitle || "",
      bio: f["Short Bio"] || "",
      linkedin: f["Main Social Link/Website"] || "",
      email: f["Email Contact"] || "",
      phone: f["Phone Contact"] || "",
      tags: f.Hashtags || [],
      headshot: headshotArr[0]?.url || "",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 3: Test with curl (after local deploy or emulator)**

```bash
# Replace REC_ID with a real participant record ID from Airtable
curl "https://<your-region>-meetingos-vonwong.cloudfunctions.net/api/api/profile?recordId=REC_ID"
# Expected: JSON with name, subtitle, bio, etc.
```

**Step 4: Commit**

```bash
git add functions/index.js
git commit -m "feat: add airtableRequest helper and GET /api/profile"
```

---

## Task 3: Backend — PATCH /api/profile

**Files:**
- Modify: `functions/index.js`

**Step 1: Add PATCH /api/profile route in `functions/index.js` after the GET route**

```js
app.patch("/api/profile", async (req, res) => {
  const { recordId, fields } = req.body || {};
  if (!recordId || !recordId.startsWith("rec")) {
    return res.status(400).json({ error: "Invalid recordId" });
  }
  const allowed = ["Title", "Subtitle", "Short Bio", "Main Social Link/Website",
                   "Email Contact", "Phone Contact", "Hashtags"];
  const safe = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) safe[key] = fields[key];
  }
  try {
    const pat = process.env.AIRTABLE_PAT;
    const { status, body } = await airtableRequest(
      "PATCH",
      `/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}/${encodeURIComponent(recordId)}`,
      pat,
      { fields: safe }
    );
    if (body.error) return res.status(status).json({ error: body.error.message });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Test with curl**

```bash
curl -X PATCH "https://<fn-url>/api/api/profile" \
  -H "Content-Type: application/json" \
  -d '{"recordId":"REC_ID","fields":{"Subtitle":"Testing subtitle"}}'
# Expected: {"ok":true}
```

**Step 3: Commit**

```bash
git add functions/index.js
git commit -m "feat: add PATCH /api/profile"
```

---

## Task 4: Backend — POST /api/upload-photo

**Files:**
- Modify: `functions/index.js`

Airtable Content API uploads binary directly to an attachment field. Requires the **field ID** (not field name) for the Headshot field. Look it up once:

```bash
# Run this locally to get the field ID
MONGO_DB_URI=placeholder AIRTABLE_PAT=$(gcloud secrets versions access latest --secret=AIRTABLE_PAT --project=meetingos-vonwong) node -e "
const https = require('https');
const pat = process.env.AIRTABLE_PAT;
const options = {
  hostname: 'api.airtable.com',
  path: '/v0/meta/bases/appLtX5g0cVrAlLkl/tables',
  headers: { Authorization: 'Bearer ' + pat }
};
https.get(options, r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    const tables = JSON.parse(d).tables;
    const items = tables.find(t => t.id === 'tblpvnCFglIv3Uffy');
    const hs = items.fields.find(f => f.name === 'Headshot');
    console.log('Headshot field ID:', hs?.id);
  });
});
"
```

Note the field ID (looks like `fldXXXXXXXXXXXXXX`). Hardcode it as a constant.

**Step 1: Add the constant and upload route in `functions/index.js`**

```js
// Add near top with other constants:
const HEADSHOT_FIELD_ID = "fldXXXXXXXXXXXXXX"; // Replace with actual ID from lookup above

// Add route:
app.post("/api/upload-photo", async (req, res) => {
  const { recordId, fileData, contentType } = req.body || {};
  if (!recordId || !recordId.startsWith("rec") || !fileData) {
    return res.status(400).json({ error: "Missing recordId or fileData" });
  }
  const pat = process.env.AIRTABLE_PAT;
  const buf = Buffer.from(fileData, "base64");

  try {
    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: "content.airtable.com",
        path: `/v0/${AIRTABLE_BASE}/${encodeURIComponent(recordId)}/${HEADSHOT_FIELD_ID}/uploadAttachment`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${pat}`,
          "Content-Type": contentType || "image/jpeg",
          "x-airtable-content-length-for-audit": buf.byteLength,
          "Content-Length": buf.byteLength,
        },
      };
      const req2 = https.request(options, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => {
          try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
        });
      });
      req2.on("error", reject);
      req2.write(buf);
      req2.end();
    });

    if (result.error) return res.status(400).json({ error: result.error.message });
    // Airtable returns the updated record; grab the first attachment's URL
    const url = result.fields?.Headshot?.[0]?.url || "";
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Commit**

```bash
git add functions/index.js
git commit -m "feat: add POST /api/upload-photo for Airtable headshot"
```

---

## Task 5: ProfilePanel.vue component

**Files:**
- Create: `client/src/components/ProfilePanel.vue`

Install `cropperjs` first:

```bash
cd client && npm install cropperjs
```

Create `client/src/components/ProfilePanel.vue`:

```vue
<template>
  <div class="pp-overlay" @click.self="$emit('close')">
    <div class="pp-panel">
      <!-- Header -->
      <div class="pp-header">
        <img src="/pigeon-logo.svg" alt="Metacrisis Salon" class="pp-logo" />
        <button class="pp-close" @click="$emit('close')" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="pp-body" v-if="!loading">
        <!-- Photo -->
        <div class="pp-photo-wrap">
          <button class="pp-photo-btn" @click="triggerPhotoInput" :disabled="uploadingPhoto">
            <img v-if="headshot" :src="headshot" :alt="name" class="pp-photo-img" />
            <span v-else class="pp-photo-initials">{{ initials }}</span>
            <span class="pp-photo-overlay">
              <span v-if="uploadingPhoto">…</span>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </span>
          </button>
          <input ref="photoInput" type="file" accept="image/*" @change="onPhotoSelect" style="display:none" />
          <p class="pp-photo-hint">Tap to change photo</p>
        </div>

        <!-- Crop modal -->
        <div v-if="cropSrc" class="pp-crop-overlay">
          <div class="pp-crop-modal">
            <p class="pp-crop-hint">Scroll to zoom · Drag to reposition</p>
            <div class="pp-crop-area" ref="cropArea"></div>
            <div class="pp-crop-actions">
              <button class="pp-crop-cancel" @click="cancelCrop">Cancel</button>
              <button class="pp-crop-confirm" @click="confirmCrop">Use photo</button>
            </div>
          </div>
        </div>

        <h2 class="pp-title">Your Profile</h2>

        <!-- Core fields -->
        <section class="pp-section">
          <div class="pp-field">
            <label class="pp-label">Name</label>
            <input class="pp-input" v-model="name" placeholder="Your name" />
          </div>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">Subtitle <span class="pp-label-hint">— your one-liner</span></label>
              <PrivacyToggle :isPublic="privacy.subtitle" @toggle="toggle('subtitle')" />
            </div>
            <input class="pp-input" v-model="subtitle"
              placeholder="e.g. Building the Community That Survives the Crisis" />
          </div>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">Short bio</label>
              <PrivacyToggle :isPublic="privacy.bio" @toggle="toggle('bio')" />
            </div>
            <textarea class="pp-input pp-textarea" v-model="bio" rows="3"
              placeholder="A sentence or two about who you are and what you care about" />
          </div>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">LinkedIn / website</label>
              <PrivacyToggle :isPublic="privacy.linkedin" @toggle="toggle('linkedin')" />
            </div>
            <input class="pp-input" v-model="linkedin" placeholder="https://linkedin.com/in/..." />
          </div>
        </section>

        <!-- Contact (private by default) -->
        <section class="pp-section pp-section--private">
          <h3 class="pp-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Contact info
          </h3>
          <p class="pp-section-desc">Private by default — toggle to share with other participants.</p>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">Email</label>
              <PrivacyToggle :isPublic="privacy.email" @toggle="toggle('email')" />
            </div>
            <input class="pp-input" type="email" v-model="email" placeholder="your@email.com" />
          </div>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">Phone</label>
              <PrivacyToggle :isPublic="privacy.phone" @toggle="toggle('phone')" />
            </div>
            <input class="pp-input" type="tel" v-model="phone" placeholder="+1 (555) 000-0000" />
          </div>
        </section>

        <!-- Actions -->
        <div class="pp-actions">
          <p v-if="saveError" class="pp-save-error">{{ saveError }}</p>
          <button class="pp-save" @click="save" :disabled="saving">
            {{ saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile' }}
          </button>
          <button class="pp-logout" @click="logout">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      </div>

      <div v-else class="pp-loading">Loading…</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

const DEFAULT_PRIVACY = {
  subtitle: true, bio: true, linkedin: true, email: false, phone: false,
};

function loadPrivacy(recordId) {
  try {
    return { ...DEFAULT_PRIVACY, ...JSON.parse(localStorage.getItem(`dc_privacy_${recordId}`) || "{}") };
  } catch { return { ...DEFAULT_PRIVACY }; }
}
function savePrivacy(recordId, privacy) {
  localStorage.setItem(`dc_privacy_${recordId}`, JSON.stringify(privacy));
}

export default {
  name: "ProfilePanel",
  components: {
    PrivacyToggle: {
      props: ["isPublic"],
      emits: ["toggle"],
      template: `
        <button type="button" class="pp-privacy-toggle"
          :class="isPublic ? 'pp-privacy-toggle--public' : 'pp-privacy-toggle--private'"
          @click="$emit('toggle')">
          <svg v-if="isPublic" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          {{ isPublic ? 'Public' : 'Private' }}
        </button>
      `,
    },
  },
  emits: ["close", "logout"],
  setup(_, { emit }) {
    const recordId = localStorage.getItem("dc_record_id") || "";

    const loading = ref(true);
    const name = ref("");
    const subtitle = ref("");
    const bio = ref("");
    const linkedin = ref("");
    const email = ref("");
    const phone = ref("");
    const headshot = ref("");
    const privacy = ref(loadPrivacy(recordId));
    const saving = ref(false);
    const saved = ref(false);
    const saveError = ref("");
    const uploadingPhoto = ref(false);
    const photoInput = ref(null);
    const cropArea = ref(null);
    const cropSrc = ref(null);
    let cropperInstance = null;

    const initials = computed(() =>
      name.value.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?"
    );

    onMounted(async () => {
      try {
        const res = await fetch(`/api/profile?recordId=${encodeURIComponent(recordId)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        name.value     = data.name || "";
        subtitle.value = data.subtitle || "";
        bio.value      = data.bio || "";
        linkedin.value = data.linkedin || "";
        email.value    = data.email || "";
        phone.value    = data.phone || "";
        headshot.value = data.headshot || "";
      } catch { /* keep defaults */ }
      finally { loading.value = false; }
    });

    const toggle = (field) => {
      privacy.value = { ...privacy.value, [field]: !privacy.value[field] };
      savePrivacy(recordId, privacy.value);
    };

    const save = async () => {
      if (saving.value) return;
      saving.value = true;
      saveError.value = "";
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordId,
            fields: {
              Title: name.value.trim(),
              Subtitle: subtitle.value.trim(),
              "Short Bio": bio.value.trim(),
              "Main Social Link/Website": linkedin.value.trim(),
              "Email Contact": email.value.trim(),
              "Phone Contact": phone.value.trim(),
            },
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          saveError.value = d.error || "Save failed — try again";
          return;
        }
        if (name.value.trim()) localStorage.setItem("dc_user_name", name.value.trim());
        saved.value = true;
        setTimeout(() => (saved.value = false), 2000);
      } catch { saveError.value = "Network error — try again"; }
      finally { saving.value = false; }
    };

    const logout = () => {
      localStorage.removeItem("dc_user_name");
      localStorage.removeItem("dc_record_id");
      emit("logout");
    };

    const triggerPhotoInput = () => photoInput.value?.click();

    const onPhotoSelect = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      cropSrc.value = URL.createObjectURL(file);
      e.target.value = "";
      nextTick(() => {
        if (!cropArea.value) return;
        const img = document.createElement("img");
        img.src = cropSrc.value;
        cropArea.value.innerHTML = "";
        cropArea.value.appendChild(img);
        cropperInstance?.destroy();
        cropperInstance = new Cropper(img, {
          aspectRatio: 1,
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 0.8,
          responsive: true,
          background: false,
        });
      });
    };

    const cancelCrop = () => {
      cropperInstance?.destroy();
      cropperInstance = null;
      URL.revokeObjectURL(cropSrc.value);
      cropSrc.value = null;
    };

    const confirmCrop = async () => {
      if (!cropperInstance) return;
      const canvas = cropperInstance.getCroppedCanvas({ width: 800, height: 800 });
      const base64 = canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
      cancelCrop();
      uploadingPhoto.value = true;
      try {
        const res = await fetch("/api/upload-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId, fileData: base64, contentType: "image/jpeg" }),
        });
        const data = await res.json();
        if (data.url) headshot.value = data.url;
      } catch { /* fail silently — photo isn't critical */ }
      finally { uploadingPhoto.value = false; }
    };

    return {
      loading, name, subtitle, bio, linkedin, email, phone, headshot,
      privacy, saving, saved, saveError, uploadingPhoto,
      photoInput, cropArea, cropSrc, initials,
      toggle, save, logout, triggerPhotoInput, onPhotoSelect, cancelCrop, confirmCrop,
    };
  },
};
</script>

<style lang="scss" scoped>
.pp-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0, 0, 0, 0.65);
  display: flex; justify-content: flex-end;
  animation: pp-fade-in 0.2s ease both;
}
@keyframes pp-fade-in { from { opacity: 0; } to { opacity: 1; } }

.pp-panel {
  width: 100%; max-width: 440px; height: 100%;
  background: var(--surface, #161616);
  border-left: 1px solid var(--border-hover, rgba(245,240,232,0.22));
  display: flex; flex-direction: column; overflow: hidden;
  animation: pp-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
  @media (max-width: 480px) { max-width: 100%; border-left: none; }
}
@keyframes pp-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

.pp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid var(--border, rgba(245,240,232,0.10));
  flex-shrink: 0;
}
.pp-logo { width: 28px; height: 28px; object-fit: contain; }
.pp-close {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--border); border-radius: 50%;
  color: var(--text-dim, rgba(245,240,232,0.28)); cursor: pointer; transition: all 0.15s;
  &:hover { border-color: var(--border-hover); color: var(--text-secondary); }
}

.pp-body {
  flex: 1; overflow-y: auto; padding: 24px 20px 40px;
  display: flex; flex-direction: column; gap: 0;
}
.pp-loading {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; color: var(--text-dim);
}

/* Photo */
.pp-photo-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 24px; }
.pp-photo-btn {
  position: relative; width: 80px; height: 80px; border-radius: 50%;
  border: 2px solid var(--border-hover); background: rgba(232,93,74,0.12);
  cursor: pointer; overflow: hidden; transition: border-color 0.2s;
  &:hover { border-color: var(--accent, #E85D4A); }
}
.pp-photo-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pp-photo-initials {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; font-weight: 700; color: var(--accent, #E85D4A);
}
.pp-photo-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s; color: #fff;
  .pp-photo-btn:hover & { opacity: 1; }
}
.pp-photo-hint { font-size: 0.72rem; color: var(--text-dim); }

/* Crop modal */
.pp-crop-overlay {
  position: fixed; inset: 0; z-index: 9100;
  background: rgba(0,0,0,0.85);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.pp-crop-modal {
  background: var(--surface); border: 1px solid var(--border-hover);
  border-radius: 16px; padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
  width: 100%; max-width: 340px;
}
.pp-crop-hint { font-size: 0.75rem; color: var(--text-dim); text-align: center; }
.pp-crop-area {
  height: 280px; border-radius: 10px; overflow: hidden;
  background: #000; position: relative;
  img { max-width: 100%; }
}
.pp-crop-actions { display: flex; gap: 10px; }
.pp-crop-cancel {
  flex: 1; padding: 10px; background: none; border: 1px solid var(--border-hover);
  border-radius: 8px; color: var(--text-secondary); font-size: 0.85rem; cursor: pointer;
}
.pp-crop-confirm {
  flex: 1; padding: 10px; background: var(--accent); border: none;
  border-radius: 8px; color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}

/* Title */
.pp-title {
  font-family: var(--font-display, 'Fraunces', serif);
  font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em;
  color: var(--text); margin-bottom: 20px;
}

/* Sections */
.pp-section {
  display: flex; flex-direction: column; gap: 16px;
  padding-bottom: 24px; margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
  &:last-of-type { border-bottom: none; margin-bottom: 0; }
  &--private { background: rgba(245,240,232,0.02); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
}
.pp-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);
  letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 4px;
}
.pp-section-desc { font-size: 0.78rem; color: var(--text-dim); line-height: 1.5; margin-top: -8px; }

/* Fields */
.pp-field { display: flex; flex-direction: column; gap: 6px; }
.pp-label-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pp-label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }
.pp-label-hint { font-weight: 400; color: var(--text-dim); }
.pp-input {
  width: 100%; padding: 10px 14px;
  background: rgba(245,240,232,0.05); border: 1px solid var(--border-hover);
  border-radius: 8px; color: var(--text); font-size: 0.88rem;
  transition: border-color 0.15s, background 0.15s;
  &::placeholder { color: var(--text-dim); }
  &:focus { outline: none; border-color: var(--accent); background: rgba(232,93,74,0.04); }
}
.pp-textarea { resize: vertical; min-height: 72px; }

/* Privacy toggle */
.pp-privacy-toggle {
  display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
  font-size: 0.7rem; font-weight: 500; padding: 3px 8px; border-radius: 100px; cursor: pointer;
  transition: all 0.15s; border: 1px solid;
  &--public {
    color: rgba(100,200,140,0.9); background: rgba(100,200,140,0.1);
    border-color: rgba(100,200,140,0.3);
  }
  &--private {
    color: var(--text-dim); background: transparent;
    border-color: var(--border);
  }
}

/* Actions */
.pp-actions { display: flex; flex-direction: column; gap: 10px; padding-top: 8px; }
.pp-save-error {
  font-size: 0.8rem; color: #f07060; text-align: center;
  background: rgba(232,93,74,0.08); border-radius: 8px; padding: 8px 12px;
}
.pp-save {
  width: 100%; padding: 13px; background: var(--accent); border: none;
  border-radius: 10px; color: #fff; font-size: 0.95rem; font-weight: 600;
  cursor: pointer; transition: background 0.2s, opacity 0.2s;
  box-shadow: 0 4px 20px rgba(232,93,74,0.3);
  &:hover:not(:disabled) { background: var(--accent-hover, #f07060); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
.pp-logout {
  width: 100%; padding: 11px; background: none; border: 1px solid var(--border);
  border-radius: 10px; color: var(--text-dim); font-size: 0.85rem;
  display: flex; align-items: center; justify-content: center; gap: 7px; cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  &:hover { color: var(--text-secondary); border-color: var(--border-hover); }
}
</style>
```

**Step 1: Install cropperjs**

```bash
cd /Users/vonwong/Dropbox/ClaudeCode/MeetingOS/client && npm install cropperjs
```

**Step 2: Create the file exactly as above**

**Step 3: Commit**

```bash
git add client/src/components/ProfilePanel.vue client/package.json client/package-lock.json
git commit -m "feat: add ProfilePanel.vue with photo crop, privacy toggles, Airtable sync"
```

---

## Task 6: Wire avatar button in App.vue

**Files:**
- Modify: `client/src/App.vue`

Replace the current `nav-right` block and add the ProfilePanel component.

**Step 1: Update `<template>` in `App.vue`**

Replace the `<div class="nav-right">` block:

```html
<!-- FROM -->
<div class="nav-right" v-if="userName">
  <span class="nav-greeting">{{ userName }}</span>
  <button class="nav-signout" @click="signOut">Sign out</button>
</div>

<!-- TO -->
<div class="nav-right" v-if="userName">
  <span class="nav-greeting">{{ userName }}</span>
  <button v-if="isParticipant" class="nav-avatar" @click="profileOpen = true" :title="userName">
    <img v-if="profileHeadshot" :src="profileHeadshot" class="nav-avatar-img" :alt="userName" />
    <span v-else class="nav-avatar-initials">{{ avatarInitials }}</span>
  </button>
  <button v-else class="nav-signout" @click="signOut">Sign out</button>
</div>

<!-- Add ProfilePanel just before closing </div> of app-shell -->
<ProfilePanel
  v-if="profileOpen"
  @close="profileOpen = false"
  @logout="onProfileLogout"
/>
```

**Step 2: Update `<script>` in `App.vue`**

```js
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import ProfilePanel from "./components/ProfilePanel.vue";

export default {
  components: { ProfilePanel },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const userName = ref(localStorage.getItem("dc_user_name") || "");
    const profileOpen = ref(false);
    const profileHeadshot = ref("");

    const isLoginPage = computed(() => route.name === "login");
    const isParticipant = computed(() => {
      const id = localStorage.getItem("dc_record_id") || "";
      return id.startsWith("rec");
    });
    const avatarInitials = computed(() =>
      userName.value.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()
    );

    watch(
      () => route.name,
      () => { userName.value = localStorage.getItem("dc_user_name") || ""; }
    );

    const signOut = () => {
      localStorage.removeItem("dc_user_name");
      localStorage.removeItem("dc_record_id");
      userName.value = "";
      router.push("/login");
    };

    const onProfileLogout = () => {
      userName.value = "";
      profileOpen.value = false;
      router.push("/login");
    };

    return {
      userName, isLoginPage, isParticipant, avatarInitials,
      profileOpen, profileHeadshot,
      signOut, onProfileLogout,
    };
  },
};
```

**Step 3: Add nav-avatar styles to `App.vue` `<style lang="scss" scoped>` section**

Add after `.nav-signout` styles:

```scss
.nav-avatar {
  width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid var(--border-hover);
  background: rgba(232, 93, 74, 0.15); cursor: pointer; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  transition: border-color 0.2s, transform 0.15s;
  padding: 0;
  &:hover { border-color: var(--accent); transform: scale(1.06); }
}
.nav-avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.nav-avatar-initials {
  font-size: 0.65rem; font-weight: 700; color: var(--accent); letter-spacing: 0.02em;
}
```

**Step 4: Build and test**

```bash
cd client && npm run build
```

- Log in as a participant (phone-verified) → avatar circle appears top-right
- Click avatar → ProfilePanel slides in from right
- Log in as guest → standard "Sign out" button (no avatar)
- Edit fields, save → Airtable record updates
- Log out from panel → redirected to `/login`

**Step 5: Commit**

```bash
git add client/src/App.vue
git commit -m "feat: add profile avatar button and ProfilePanel integration in App.vue"
```

---

## Task 7: Deploy and verify

**Step 1: Build client**

```bash
cd /Users/vonwong/Dropbox/ClaudeCode/MeetingOS/client && npm run build
```

**Step 2: Deploy**

```bash
cd /Users/vonwong/Dropbox/ClaudeCode/MeetingOS && firebase deploy
```

**Step 3: End-to-end smoke test**

1. Go to `https://meeting.dearcrisis.com/login`  
   → Confirms "Metacrisis Salon 9" branding visible

2. Log in as a verified participant (name + phone)  
   → Avatar circle appears top-right with initials

3. Click avatar → Profile panel slides in  
   → Fields pre-filled from Airtable

4. Edit subtitle, bio, LinkedIn → click Save  
   → Toast "✓ Saved" appears  
   → Check Airtable record in base to confirm fields updated

5. Upload a photo → crop modal appears → confirm  
   → Headshot appears in panel and avatar

6. Click Log out  
   → Redirected to `/login`, nav clears

7. Log in as guest (`?mode=join`)  
   → "Sign out" button appears (not avatar) — profile panel not accessible

**Step 4: Final commit if any last tweaks**

```bash
git add -A
git commit -m "chore: post-deploy tweaks"
```

---

## Notes for Implementer

- **`AIRTABLE_BASE`** in `functions/index.js` is already set to `appLtX5g0cVrAlLkl` (DearCrisis) — profile routes use the same base as login/verify. No new secret needed.
- **`Subtitle` field** exists in the DearCrisis Items table (confirmed via `fetchAllParticipants` which already fetches it).
- **`Privacy Settings`** stored in `localStorage` only (key: `dc_privacy_{recordId}`) — no Airtable schema change required.
- **Photo upload** requires looking up the `Headshot` field ID (step in Task 4). If the Content API PATCH returns an error, skip photo for now and ship without it.
- **`cropperjs`** is vanilla JS — import the CSS too (`import "cropperjs/dist/cropper.css"`) or the cropper UI won't render correctly.
