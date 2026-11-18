<template>
  <div class="login-page">
    <div class="login-card">

      <div class="brand-mark">
        <img :src="`${base}pigeon-logo.svg`" alt="Dear Crisis" class="pigeon-logo" />
      </div>
      <div class="brand-name">Dear Crisis</div>
      <div class="brand-sub">Community Scheduling</div>
      <div class="divider"></div>

      <h1 class="login-title">Who are you?</h1>
      <p class="login-desc">
        Sign in the way you do on the Dear Crisis app. We'll text or email you a code, then bring you straight back here.
      </p>
      <button class="primary-btn" @click="signIn">Sign in with Dear Crisis →</button>

      <template v-if="isJoinMode">
        <div class="guest-divider"><span>or</span></div>
        <form class="verify-form" @submit.prevent="continueAsGuest">
          <input
            ref="nameRef"
            v-model="guestName"
            type="text"
            class="login-input"
            placeholder="Your name"
            autocomplete="name"
            autocapitalize="words"
          />
          <button type="submit" class="guest-btn" :disabled="!guestName.trim()">
            Join as {{ guestName.trim() ? `"${guestName.trim()}"` : "a guest" }}
          </button>
        </form>
      </template>

      <div v-else class="onboarding-block">
        <p class="onboarding-text">
          Not part of Dear Crisis yet? Come to one of our gatherings and you'll be able to sign in.
        </p>
        <a href="https://www.dearcrisis.com" target="_blank" rel="noopener" class="onboarding-link">
          Visit DearCrisis.com →
        </a>
      </div>

      <p class="login-footer">Powered by <span class="footer-brand">Dear Crisis</span></p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { BASE, signInWithDearCrisis } from "../dcSession";

// Members sign in through the Dear Crisis app's own door (2026-11-18): this tool lives at
// beta.dearcrisis.com/meeting/ and shares the app's sign-in, so there is one door, one session and one
// profile for both (dcSession.ts). The door brings them back to the page they asked for. A guest on an
// event link can still join that event under a name they type, as before.
export default {
  name: "Login",
  setup() {
    const router = useRouter();
    const route = useRoute();
    const isJoinMode = route.query.mode === "join";
    const guestName = ref("");
    const nameRef = ref(null);
    const asked = route.query.redirect;
    const redirect =
      typeof asked === "string" && asked.startsWith("/") && !asked.startsWith("//") ? asked : "/";

    onMounted(() => {
      if (isJoinMode) nextTick(() => nameRef.value?.focus());
    });

    const signIn = () => signInWithDearCrisis(redirect);

    const continueAsGuest = () => {
      const name = guestName.value.trim();
      if (!name) return;
      localStorage.setItem("dc_user_name", name);
      localStorage.setItem("dc_record_id", Math.random().toString(36).substring(2, 11));
      router.push(redirect);
    };

    return { base: BASE, isJoinMode, guestName, nameRef, signIn, continueAsGuest };
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
