<template>
  <div class="login-page">
    <div class="login-card">

      <div class="brand-mark">
        <img src="/pigeon-logo.svg" alt="Metacrisis Salon" class="pigeon-logo" />
      </div>
      <div class="brand-name">Metacrisis Salon 9</div>
      <div class="brand-sub">Community Scheduling</div>
      <div class="divider"></div>

      <!-- Step 1: find your name in the Dear Crisis community (Arcos) -->
      <template v-if="step === 'name'">
        <h1 class="login-title">Who are you?</h1>
        <p class="login-desc" v-if="isJoinMode">
          Find your name below, or join as a guest.
        </p>
        <p class="login-desc" v-else>
          Type your name to find yourself in the Dear Crisis community.
        </p>

        <div class="picker">
          <div class="search-wrap">
            <span class="search-icon">⌕</span>
            <input
              ref="searchRef"
              type="search"
              v-model="query"
              placeholder="e.g. Benjamin…"
              class="search-input"
              autocomplete="off"
              autocapitalize="words"
              spellcheck="false"
            />
          </div>

          <div class="list-wrap" v-if="hits.length > 0">
            <div
              v-for="p in hits"
              :key="p.id"
              class="person-row"
              @click="pick(p)"
            >
              <div class="person-avatar">{{ initials(p.name) }}</div>
              <div class="person-info">
                <div class="person-name">{{ p.name }}</div>
              </div>
              <div class="person-arrow">→</div>
            </div>
          </div>

          <p v-if="searchStatus === 'loading'" class="search-hint">Looking…</p>
          <p v-else-if="searchStatus === 'error'" class="search-hint error">{{ searchError }}</p>
          <p v-else-if="searchStatus === 'empty' && !isJoinMode" class="search-hint">
            Not found in the community list. Try your first or last name on its own.
          </p>
          <p v-if="error" class="verify-error">{{ error }}</p>

          <div v-if="searchStatus === 'empty' && !isJoinMode" class="onboarding-block">
            <p class="onboarding-text">
              To become a Dear Crisis community member, attend one of our gatherings.
            </p>
            <a href="https://www.dearcrisis.com" target="_blank" rel="noopener" class="onboarding-link">
              Visit DearCrisis.com →
            </a>
          </div>

          <template v-if="isJoinMode && query.trim()">
            <div class="guest-divider"><span>or</span></div>
            <button class="guest-btn" @click="continueAsGuest">
              Join as "{{ query.trim() }}" (guest)
            </button>
          </template>
        </div>
      </template>

      <!-- Step 2: how to get the code, when the profile offers both -->
      <template v-if="step === 'choose'">
        <button class="back-btn" @click="backToName">← Back</button>
        <div class="selected-pill">{{ picked.name }}</div>
        <h1 class="login-title">Verify it's you</h1>
        <template v-if="options">
          <p class="login-desc">We'll send a 6-digit code to the contact on your Dear Crisis profile.</p>
          <div class="choice-list">
            <button class="choice-btn" @click="sendCode('phone')">Text a code to {{ options.phone }}</button>
            <button class="choice-btn" @click="sendCode('email')">Email a code to {{ options.email }}</button>
          </div>
        </template>
        <p v-else class="login-desc"><span class="btn-loading">···</span></p>
        <p v-if="error" class="verify-error">{{ error }}</p>
      </template>

      <!-- Step 3: the code -->
      <template v-if="step === 'code'">
        <button class="back-btn" @click="backToName">← Back</button>
        <div class="selected-pill">{{ picked.name }}</div>
        <h1 class="login-title">Enter your code</h1>
        <p class="login-desc" v-if="sending">Sending your code…</p>
        <p class="login-desc" v-else-if="masked">
          We {{ by === 'phone' ? 'texted' : 'emailed' }} a 6-digit code to <strong>{{ masked }}</strong>.
        </p>
        <p class="login-desc" v-else>
          We {{ by === 'phone' ? 'texted' : 'emailed' }} a 6-digit code to the contact on your profile.
        </p>
        <p v-if="note" class="code-note">{{ note }}</p>

        <form @submit.prevent="verifyCode" class="verify-form">
          <input
            ref="codeRef"
            type="text"
            v-model="code"
            placeholder="123456"
            class="login-input code-input"
            autocomplete="one-time-code"
            inputmode="numeric"
            maxlength="6"
          />
          <p v-if="error" class="verify-error">{{ error }}</p>
          <button type="submit" class="primary-btn" :disabled="code.trim().length !== 6 || verifying || sending">
            <span v-if="!verifying">Sign in →</span>
            <span v-else class="btn-loading">···</span>
          </button>
        </form>
        <div class="code-links" v-if="!sending">
          <button class="link-btn" @click="sendCode(by)">Send a new code</button>
          <button v-if="by === 'phone'" class="link-btn" @click="sendCode('email')">Email it instead</button>
        </div>
      </template>

      <p class="login-footer">Powered by <span class="footer-brand">Dear Crisis</span> · Metacrisis Salon 9</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";

// Sign-in is Arcos's own Dear Crisis door (the one beta.dearcrisis.com uses), relayed by this app's
// functions (/api/arcos/*): find your name on the community roster, then a 6-digit code that Arcos
// texts or emails to the contact on that profile. Anyone Arcos lets through can sign in.

// Arcos's own words for each refusal (beta's door, screens/door.js)
const SAYS = {
  "profile-taken": "Someone has already claimed this profile. If that was not you, tell an organiser.",
  "not-an-attendee": "That name is not on a guest list here.",
  "no-email-on-file": "There is no email on that profile, so we cannot send a code. An organiser can add one for you.",
  "code-not-sent": "We could not send a code just now. Wait a moment and try again.",
  "bad-code": "That code did not work. Check the digits, or send a new one.",
  "no-person": "We could not find that profile.",
  wait: "A code was just sent. Wait a minute before asking for another.",
  offline: "We could not reach Dear Crisis just now. Try again.",
};
const say = (r) => {
  const code = r && r.error;
  if (code && SAYS[code]) return SAYS[code];
  const m = r && typeof r.message === "string" ? r.message.trim() : "";
  const ref = r && typeof r.ref === "string" && /^[A-Z0-9]{6}$/.test(r.ref) ? ` Reference ${r.ref}.` : "";
  return `${m && m.length <= 200 ? m : "Something went wrong. Try again."}${ref}`;
};

const post = async (path, body) => {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json().catch(() => ({ ok: false, error: "offline" }));
  } catch {
    return { ok: false, error: "offline" };
  }
};

export default {
  name: "Login",
  setup() {
    const router = useRouter();
    const route  = useRoute();

    const isJoinMode = route.query.mode === "join";
    const step = ref("name");
    const error = ref("");

    // Step 1: the roster search (Arcos answers at most 8 names, two characters at least)
    const query       = ref("");
    const hits        = ref([]);
    const searching   = ref(false);
    const searchError = ref("");
    const searchedFor = ref("");
    const searchRef   = ref(null);
    const cache = new Map();
    let seq = 0;
    let timer = null;

    const runSearch = async (q) => {
      const key = q.toLowerCase();
      if (cache.has(key)) {
        hits.value = cache.get(key);
        searchedFor.value = q;
        searching.value = false;
        return;
      }
      const mine = ++seq;
      try {
        const res = await fetch(`/api/arcos/roster?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        const people = Array.isArray(data.people) ? data.people : [];
        cache.set(key, people);
        if (mine !== seq) return;
        hits.value = people;
        searchedFor.value = q;
        searchError.value = "";
      } catch {
        if (mine !== seq) return;
        searchError.value = "Couldn't reach the community list. Check your connection.";
      } finally {
        if (mine === seq) searching.value = false;
      }
    };

    watch(query, (v) => {
      const q = v.trim();
      error.value = "";
      clearTimeout(timer);
      if (q.length < 2) {
        seq++;
        hits.value = [];
        searching.value = false;
        searchError.value = "";
        searchedFor.value = "";
        return;
      }
      searching.value = true;
      timer = setTimeout(() => runSearch(q), 250);
    });

    const searchStatus = computed(() => {
      const q = query.value.trim();
      if (q.length < 2) return null;
      if (searchError.value) return "error";
      if (searching.value && !hits.value.length) return "loading";
      if (!searching.value && searchedFor.value === q && hits.value.length === 0) return "empty";
      return null;
    });

    // Steps 2 and 3
    const picked    = ref(null);
    const options   = ref(null);
    const by        = ref("email");
    const masked    = ref("");
    const note      = ref("");
    const sending   = ref(false);
    const code      = ref("");
    const verifying = ref(false);
    const codeRef   = ref(null);

    onMounted(() => nextTick(() => searchRef.value?.focus()));

    const initials = (name) =>
      name.split(" ").filter(Boolean).map((w) => w[0]).join("").substring(0, 2).toUpperCase();

    const done = (name, id) => {
      localStorage.setItem("dc_user_name", name);
      localStorage.setItem("dc_record_id", id);
      const redirect = route.query.redirect;
      router.push(typeof redirect === "string" ? redirect : "/");
    };

    const continueAsGuest = () => {
      const name = query.value.trim();
      if (!name) return;
      done(name, Math.random().toString(36).substring(2, 11));
    };

    const backToName = () => {
      step.value = "name";
      picked.value = null;
      options.value = null;
      code.value = "";
      error.value = "";
      note.value = "";
      nextTick(() => searchRef.value?.focus());
    };

    // Send the code: by text when asked, falling back to email the way beta's door does
    const sendCode = async (how) => {
      if (!picked.value || sending.value) return;
      const person = picked.value.id;
      by.value = how === "phone" ? "phone" : "email";
      step.value = "code";
      masked.value = "";
      code.value = "";
      error.value = "";
      sending.value = true;
      const r = await post("/api/arcos/start", { person, ...(by.value === "phone" ? { by: "phone" } : {}) });
      if (!picked.value || picked.value.id !== person) return;
      sending.value = false;
      if (r.ok) {
        masked.value = r.masked || "";
        nextTick(() => codeRef.value?.focus());
        return;
      }
      if (by.value === "phone" && r.error !== "wait") {
        note.value = r.error === "no-text"
          ? "This profile can't take a text code yet, so your code went by email."
          : "We couldn't text a code just now, so your code went by email.";
        return sendCode("email");
      }
      if (r.error === "wait") {
        error.value = SAYS.wait;
        return;
      }
      step.value = "name";
      error.value = say(r);
    };

    const pick = async (p) => {
      picked.value = { id: p.id, name: p.name };
      options.value = null;
      note.value = "";
      error.value = "";
      step.value = "choose";
      // Which ways in this profile offers, sending nothing yet
      const r = await post("/api/arcos/options", { person: p.id });
      if (!picked.value || picked.value.id !== p.id) return;
      const ph = r.ok && r.phone && r.phone.masked;
      const em = r.ok && r.email && r.email.masked;
      if (ph && em) {
        options.value = { phone: ph, email: em };
        return;
      }
      sendCode(ph ? "phone" : "email");
    };

    const verifyCode = async () => {
      const digits = code.value.replace(/\D/g, "");
      if (digits.length !== 6 || verifying.value || !picked.value) {
        if (digits.length !== 6) error.value = "Enter the six digits.";
        return;
      }
      verifying.value = true;
      error.value = "";
      const r = await post("/api/arcos/verify", {
        person: picked.value.id,
        code: digits,
        ...(by.value === "phone" ? { by: "phone" } : {}),
      });
      verifying.value = false;
      if (r.ok) {
        done(r.name || picked.value.name, r.person || picked.value.id);
        return;
      }
      error.value = say(r);
    };

    return {
      isJoinMode, step, error,
      query, hits, searchStatus, searchError, searchRef,
      picked, options, by, masked, note, sending, code, verifying, codeRef,
      pick, sendCode, verifyCode, backToName, continueAsGuest, initials,
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

/* Status hints */
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

/* Onboarding block (member mode, name not found) */
.onboarding-block {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 14px 16px; margin-top: 2px;
  background: rgba(245,240,232,.03); border: 1px solid var(--border);
  border-radius: var(--radius-xs); text-align: center;
}
.onboarding-text {
  font-size: .8rem; color: var(--text-secondary); line-height: 1.5;
}
.onboarding-link {
  font-size: .8rem; font-weight: 600; color: var(--accent);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

/* Guest divider + button (join mode) */
.guest-divider {
  display: flex; align-items: center; gap: 10px;
  color: var(--text-dim); font-size: .72rem; letter-spacing: .08em; text-transform: uppercase;
  margin: 2px 0;
  &::before, &::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }
}
.guest-btn {
  width: 100%; padding: 11px 16px;
  background: rgba(232,93,74,.05); border: 1px solid rgba(232,93,74,.35);
  border-radius: var(--radius-xs); color: var(--accent);
  font-size: .85rem; font-weight: 500; cursor: pointer;
  transition: background .15s, border-color .15s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  &:hover {
    background: rgba(232,93,74,.10);
    border-color: rgba(232,93,74,.6);
  }
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

/* Code steps */
.choice-list { display: flex; flex-direction: column; gap: 10px; }
.choice-btn {
  width: 100%; padding: 13px 16px;
  background: rgba(245,240,232,.05); border: 1px solid var(--border-hover);
  border-radius: var(--radius-xs); color: var(--text);
  font-size: .88rem; cursor: pointer; transition: background .15s, border-color .15s;
  &:hover { background: rgba(232,93,74,.08); border-color: rgba(232,93,74,.5); }
}
.code-input { letter-spacing: .4em; font-variant-numeric: tabular-nums; }
.code-note { font-size: .78rem; color: var(--text-secondary); margin: -10px 0 14px; line-height: 1.5; }
.code-links { display: flex; justify-content: center; gap: 18px; margin-top: 14px; }
.link-btn {
  background: none; border: none; padding: 0; cursor: pointer;
  font-size: .78rem; color: var(--text-dim);
  &:hover { color: var(--accent); text-decoration: underline; }
}
</style>
