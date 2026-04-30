<template>
  <div class="app-shell">
    <div class="bg-grain" aria-hidden="true"></div>
    <div class="bg-glow" aria-hidden="true"></div>
    <header class="nav" v-if="!isLoginPage">
      <router-link class="nav-logo" to="/">
        <img src="/pigeon-logo.svg" alt="Dear Crisis" class="nav-pigeon" />
        <span class="nav-wordmark">Dear Crisis</span>
      </router-link>
      <div class="nav-right" v-if="userName">
        <span class="nav-greeting">{{ userName }}</span>
        <button v-if="isParticipant" class="nav-avatar" @click="profileOpen = true" :title="userName">
          <img v-if="profileHeadshot" :src="profileHeadshot" class="nav-avatar-img" :alt="userName" />
          <span v-else class="nav-avatar-initials">{{ avatarInitials }}</span>
        </button>
        <button v-else class="nav-signout" @click="signOut">Sign out</button>
      </div>
    </header>
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <ProfilePanel
      v-if="profileOpen"
      @close="profileOpen = false"
      @logout="onProfileLogout"
    />
  </div>
</template>

<script>
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
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #0a0a0a;
  --surface: rgba(22, 22, 22, 0.85);
  --surface-hover: rgba(35, 35, 35, 0.92);
  --border: rgba(245, 240, 232, 0.10);
  --border-hover: rgba(245, 240, 232, 0.22);
  --accent: #E85D4A;
  --accent-soft: rgba(232, 93, 74, 0.12);
  --accent-glow: rgba(232, 93, 74, 0.25);
  --accent-hover: #f07060;
  --text: #F5F0E8;
  --text-secondary: rgba(245, 240, 232, 0.55);
  --text-dim: rgba(245, 240, 232, 0.28);
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --radius: 20px;
  --radius-sm: 14px;
  --radius-xs: 10px;
  --shadow: 0 2px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border);
  --shadow-hover: 0 8px 36px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--border-hover);
}

html, body {
  min-height: 100%;
  background-color: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a { color: inherit; text-decoration: none; }
button { font-family: var(--font-body); cursor: pointer; }
input, select, textarea { font-family: var(--font-body); }
</style>

<style lang="scss" scoped>
.app-shell {
  min-height: 100vh;
  position: relative;
  background-color: var(--bg);
}

.bg-grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.032;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 200px 200px;
}

.bg-glow {
  position: fixed;
  top: -240px;
  left: 50%;
  transform: translateX(-50%);
  width: 900px;
  height: 700px;
  background: radial-gradient(ellipse, rgba(232, 93, 74, 0.065) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.nav {
  position: relative;
  z-index: 10;
  padding: 18px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);

  @media (max-width: 480px) {
    padding: 14px 18px;
  }
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: opacity 0.2s;
  text-decoration: none;
}
.nav-logo:hover { opacity: 0.75; }

.nav-pigeon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.nav-wordmark {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-greeting {
  font-size: 0.82rem;
  color: var(--text-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 380px) {
    display: none;
  }
}

.nav-signout {
  font-size: 0.78rem;
  color: var(--text-dim);
  background: none;
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 4px 12px;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--text-secondary);
    border-color: var(--border-hover);
  }
}

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

.app-main {
  position: relative;
  z-index: 1;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
