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
              <button type="button" :class="['pp-privacy-toggle', privacy.subtitle ? 'pp-privacy-toggle--public' : 'pp-privacy-toggle--private']" @click="toggle('subtitle')">
                <svg v-if="privacy.subtitle" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                {{ privacy.subtitle ? 'Public' : 'Private' }}
              </button>
            </div>
            <input class="pp-input" v-model="subtitle"
              placeholder="e.g. Building the Community That Survives the Crisis" />
          </div>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">Short bio</label>
              <button type="button" :class="['pp-privacy-toggle', privacy.bio ? 'pp-privacy-toggle--public' : 'pp-privacy-toggle--private']" @click="toggle('bio')">
                <svg v-if="privacy.bio" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                {{ privacy.bio ? 'Public' : 'Private' }}
              </button>
            </div>
            <textarea class="pp-input pp-textarea" v-model="bio" rows="3"
              placeholder="A sentence or two about who you are and what you care about" />
          </div>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">LinkedIn / website</label>
              <button type="button" :class="['pp-privacy-toggle', privacy.linkedin ? 'pp-privacy-toggle--public' : 'pp-privacy-toggle--private']" @click="toggle('linkedin')">
                <svg v-if="privacy.linkedin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                {{ privacy.linkedin ? 'Public' : 'Private' }}
              </button>
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
              <button type="button" :class="['pp-privacy-toggle', privacy.email ? 'pp-privacy-toggle--public' : 'pp-privacy-toggle--private']" @click="toggle('email')">
                <svg v-if="privacy.email" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                {{ privacy.email ? 'Public' : 'Private' }}
              </button>
            </div>
            <input class="pp-input" type="email" v-model="email" placeholder="your@email.com" />
          </div>

          <div class="pp-field">
            <div class="pp-label-row">
              <label class="pp-label">Phone</label>
              <button type="button" :class="['pp-privacy-toggle', privacy.phone ? 'pp-privacy-toggle--public' : 'pp-privacy-toggle--private']" @click="toggle('phone')">
                <svg v-if="privacy.phone" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                {{ privacy.phone ? 'Public' : 'Private' }}
              </button>
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
