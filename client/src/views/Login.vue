<template>
  <div class="login-page">
    <div class="login-card">

      <div class="brand-mark">
        <img src="/pigeon-logo.svg" alt="Dear Crisis" class="pigeon-logo" />
      </div>
      <div class="brand-name">Dear Crisis</div>
      <div class="brand-sub">Community Scheduling Assistant</div>
      <div class="divider"></div>

      <!-- Step 1: Pick name -->
      <template v-if="step === 'name'">
        <h1 class="login-title">Who are you?</h1>
        <p class="login-desc">Type your name to find yourself.</p>

        <div class="picker">
          <div class="search-wrap">
            <span class="search-icon">⌕</span>
            <input
              ref="searchRef"
              type="text"
              v-model="query"
              placeholder="e.g. Benjamin…"
              class="search-input"
              autocomplete="off"
              @focus="searchFocused = true"
              @blur="searchFocused = false"
            />
          </div>

          <!-- Matching names — only when ≤3 results -->
          <div class="list-wrap" v-if="filtered.length > 0">
            <div
              v-for="p in filtered"
              :key="p.id"
              class="person-row"
              @click="selectAndContinue(p)"
            >
              <div class="person-avatar">{{ initials(p.name) }}</div>
              <div class="person-info">
                <div class="person-name">{{ p.name }}</div>
                <div v-if="p.subtitle" class="person-sub">{{ p.subtitle }}</div>
              </div>
              <div class="person-arrow">→</div>
            </div>
          </div>

          <!-- Status hints below the input -->
          <p v-if="searchStatus === 'loading'" class="search-hint">Loading names…</p>
          <p v-else-if="searchStatus === 'narrow'" class="search-hint">Keep typing to narrow it down…</p>
          <p v-else-if="searchStatus === 'error'" class="search-hint error">{{ listError }}</p>

          <!-- New participant option when name isn't found -->
          <div v-else-if="searchStatus === 'empty'" class="new-participant">
            <p class="search-hint">Not found in the list.</p>
            <button class="new-participant-btn" @click="continueAsNew">
              Join as "{{ query.trim() }}"
            </button>
          </div>
        </div>
      </template>

      <!-- Step 2: Phone verification -->
      <template v-if="step === 'phone'">
        <button class="back-btn" @click="step = 'name'; verifyError = ''">← Back</button>
        <div class="selected-pill">{{ selected.name }}</div>
        <h1 class="login-title">Verify it's you</h1>
        <p class="login-desc">Enter the phone number associated with your registration.</p>

        <form @submit.prevent="verifyPhone" class="verify-form">
          <input
            ref="phoneRef"
            type="tel"
            v-model="phone"
            placeholder="e.g. (212) 555-0100"
            class="login-input"
            autocomplete="tel"
            inputmode="tel"
          />
          <p v-if="verifyError" class="verify-error">{{ verifyError }}</p>
          <button type="submit" class="primary-btn" :disabled="!phone.trim() || verifying">
            <span v-if="!verifying">Confirm →</span>
            <span v-else class="btn-loading">···</span>
          </button>
        </form>
      </template>

      <p class="login-footer">Powered by <span class="footer-brand">Dear Crisis</span></p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";

const MAX_RESULTS = 3;

export default {
  name: "Login",
  setup() {
    const router = useRouter();
    const route  = useRoute();

    const step = ref("name");

    // Step 1
    const participants  = ref([]);
    const loadingList   = ref(true);
    const listError     = ref(null);
    const query         = ref("");
    const selected      = ref(null);
    const searchRef     = ref(null);
    const searchFocused = ref(false);

    // Step 2
    const phone       = ref("");
    const verifying   = ref(false);
    const verifyError = ref("");
    const phoneRef    = ref(null);

    // All matches regardless of count (used for status)
    const allMatches = computed(() => {
      const q = query.value.trim().toLowerCase();
      if (q.length < 2) return null; // null = not searching yet
      return participants.value.filter((p) => p.name.toLowerCase().includes(q));
    });

    // Only expose results when narrowed to ≤ MAX_RESULTS
    const filtered = computed(() => {
      if (!allMatches.value) return [];
      return allMatches.value.length <= MAX_RESULTS ? allMatches.value : [];
    });

    const searchStatus = computed(() => {
      const q = query.value.trim();
      if (q.length < 2) return null;
      if (listError.value) return "error";
      if (loadingList.value) return "loading";
      if (!allMatches.value) return null;
      if (allMatches.value.length === 0) return "empty";
      if (allMatches.value.length > MAX_RESULTS) return "narrow";
      return null; // results are showing, no hint needed
    });

    // Fire-and-forget: don't block the UI, load names silently
    const loadParticipants = async () => {
      loadingList.value = true;
      listError.value   = null;
      try {
        const res = await fetch("/api/participants");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        participants.value = data.participants || [];
      } catch {
        listError.value = "Couldn't load participant list. Check your connection.";
      } finally {
        loadingList.value = false;
      }
    };

    onMounted(() => {
      loadParticipants(); // intentionally not awaited
      nextTick(() => searchRef.value?.focus());
    });

    const initials = (name) =>
      name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

    const continueAsNew = () => {
      const name = query.value.trim();
      if (!name) return;
      const id = Math.random().toString(36).substring(2, 11);
      localStorage.setItem("dc_user_name", name);
      localStorage.setItem("dc_record_id", id);
      const redirect = route.query.redirect;
      router.push(typeof redirect === "string" ? redirect : "/");
    };

    // Clicking a name goes directly to phone verification
    const selectAndContinue = (p) => {
      selected.value    = p;
      step.value        = "phone";
      verifyError.value = "";
      phone.value       = "";
      nextTick(() => phoneRef.value?.focus());
    };

    const verifyPhone = async () => {
      if (!phone.value.trim() || verifying.value) return;
      verifying.value   = true;
      verifyError.value = "";
      try {
        const res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId: selected.value.id, phone: phone.value.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("dc_user_name", data.name);
          localStorage.setItem("dc_record_id", selected.value.id);
          const redirect = route.query.redirect;
          router.push(typeof redirect === "string" ? redirect : "/");
        } else {
          verifyError.value = res.status === 403
            ? "Phone number doesn't match our records. Try again."
            : data.error || "Verification failed.";
        }
      } catch {
        verifyError.value = "Network error — please try again.";
      } finally {
        verifying.value = false;
      }
    };

    return {
      step, loadingList, listError, query, selected, filtered,
      searchRef, searchFocused, searchStatus,
      phone, verifying, verifyError, phoneRef,
      selectAndContinue, continueAsNew, initials, verifyPhone,
    };
  },
};
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px 48px;

  @media (min-height: 750px) { align-items: center; }
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius);
  padding: 36px 28px 28px;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,.55), 0 0 0 1px var(--border);
  animation: cardIn .5s cubic-bezier(.22,1,.36,1) both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(.97); }
  to   { opacity: 1; transform: none; }
}

.brand-mark { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }

.pigeon-logo {
  width: 52px; height: 52px; object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(232,93,74,.28));
  animation: float 3.5s ease-in-out infinite;
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}

.brand-name {
  font-family: var(--font-display);
  font-size: 1.3rem; font-weight: 700; letter-spacing: -.03em; color: var(--text);
}
.brand-sub {
  font-size: .7rem; letter-spacing: .14em; text-transform: uppercase;
  color: var(--text-dim); margin-top: 2px;
}

.divider { width: 28px; height: 1px; background: var(--border-hover); margin: 20px auto; }

.event-badge {
  display: inline-block; font-size: .68rem; font-weight: 600; letter-spacing: .12em;
  text-transform: uppercase; color: var(--accent); background: var(--accent-soft);
  border: 1px solid rgba(232,93,74,.25); border-radius: 100px; padding: 4px 14px; margin-bottom: 18px;
}

.login-title {
  font-family: var(--font-display);
  font-size: 1.8rem; font-weight: 700; letter-spacing: -.04em; color: var(--text); margin-bottom: 6px;
}
.login-desc { font-size: .85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 22px; }

/* Picker */
.picker { display: flex; flex-direction: column; gap: 10px; text-align: left; }

.search-wrap { position: relative; }
.search-input {
  width: 100%; padding: 11px 16px 11px 38px;
  background: rgba(245,240,232,.05); border: 1px solid var(--border-hover);
  border-radius: var(--radius-xs); color: var(--text); font-size: .9rem;
  transition: border-color .2s, background .2s;
  &::placeholder { color: var(--text-dim); }
  &:focus { outline: none; border-color: var(--accent); background: rgba(232,93,74,.04); }
}
.search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  font-size: 1.1rem; color: var(--text-dim); pointer-events: none;
}

/* Search status hints */
.search-hint {
  font-size: .78rem; color: var(--text-dim); text-align: center; padding: 4px 0;
  &.error { color: #f07060; }
}

/* Results list */
.list-wrap {
  border: 1px solid var(--border); border-radius: var(--radius-xs);
  background: rgba(10,10,10,.5); overflow: hidden;
}

.person-row {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  cursor: pointer; transition: background .15s; border-bottom: 1px solid var(--border);
  &:last-child { border-bottom: none; }
  &:hover { background: rgba(245,240,232,.06); }
  &:active { background: var(--accent-soft); }
}
.person-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: rgba(232,93,74,.18); border: 1px solid rgba(232,93,74,.3);
  color: var(--accent); font-size: .7rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.person-info { flex: 1; min-width: 0; }
.person-name { font-size: .88rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.person-sub  { font-size: .73rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.person-arrow { font-size: .85rem; color: var(--text-dim); flex-shrink: 0; }

/* New participant */
.new-participant { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.new-participant-btn {
  padding: 10px 20px; font-size: .85rem; font-weight: 600;
  background: rgba(245,240,232,.06); border: 1px solid var(--border-hover);
  border-radius: var(--radius-xs); color: var(--text); cursor: pointer;
  transition: background .15s, border-color .15s;
  max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  &:hover { background: rgba(245,240,232,.12); border-color: rgba(245,240,232,.3); }
}

/* Phone step */
.back-btn {
  display: block; margin-bottom: 16px; font-size: .8rem; color: var(--text-dim);
  background: none; border: none; cursor: pointer; padding: 0; text-align: left;
  &:hover { color: var(--text-secondary); }
}
.selected-pill {
  display: inline-block; font-size: .78rem; font-weight: 600;
  color: var(--text); background: rgba(245,240,232,.08);
  border: 1px solid var(--border-hover); border-radius: 100px;
  padding: 5px 16px; margin-bottom: 16px;
}

.verify-form { display: flex; flex-direction: column; gap: 10px; text-align: left; }
.login-input {
  width: 100%; padding: 14px 18px;
  background: rgba(245,240,232,.05); border: 1px solid var(--border-hover);
  border-radius: var(--radius-xs); color: var(--text); font-size: 1rem; text-align: center;
  transition: border-color .2s, background .2s;
  &::placeholder { color: var(--text-dim); }
  &:focus { outline: none; border-color: var(--accent); background: rgba(232,93,74,.05); }
}
.verify-error {
  font-size: .82rem; color: #f07060; text-align: center;
  background: rgba(232,93,74,.08); border-radius: var(--radius-xs); padding: 8px 12px;
}

.primary-btn {
  width: 100%; padding: 14px; background: var(--accent); color: #fff;
  font-size: .95rem; font-weight: 600; border: none; border-radius: var(--radius-xs);
  cursor: pointer; transition: background .2s, transform .15s, opacity .2s;
  box-shadow: 0 4px 24px rgba(232,93,74,.32);
  &:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
  &:disabled { opacity: .35; cursor: not-allowed; }
}
.btn-loading { letter-spacing: .2em; animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }

.login-footer { margin-top: 22px; font-size: .72rem; color: var(--text-dim); text-align: center; }
.footer-brand { color: var(--text-secondary); font-family: var(--font-display); }
</style>
