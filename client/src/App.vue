<template>
  <div class="app-shell">
    <div class="bg-grain" aria-hidden="true"></div>
    <div class="bg-glow" aria-hidden="true"></div>
    <header class="nav" v-if="!isLoginPage">
      <router-link class="nav-logo" to="/">
        <img :src="`${base}pigeon-logo.svg`" alt="Dear Crisis" class="nav-pigeon" />
        <span class="nav-wordmark">Dear Crisis</span>
      </router-link>
      <div class="nav-right" v-if="userName">
        <span class="nav-greeting">{{ userName }}</span>
        <button v-if="isMember" class="nav-avatar" @click="memberOpen = true" :title="userName">
          <img v-if="memberPhoto" :src="memberPhoto" class="nav-avatar-img" :alt="userName" />
          <span v-else class="nav-avatar-initials">{{ avatarInitials }}</span>
        </button>
        <button v-else-if="isParticipant" class="nav-avatar" @click="profileOpen = true" :title="userName">
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
    <!-- A member signed in through the Dear Crisis app: their profile lives there (dcSession.ts) -->
    <div v-if="memberOpen" class="dc-menu" @click.self="memberOpen = false">
      <div class="dc-menu-card" role="dialog" aria-label="Your Dear Crisis profile">
        <button class="dc-menu-close" @click="memberOpen = false" aria-label="Close">×</button>
        <img v-if="memberPhoto" :src="memberPhoto" class="dc-menu-photo" :alt="userName" />
        <span v-else class="dc-menu-photo dc-menu-initials">{{ avatarInitials }}</span>
        <div class="dc-menu-name">{{ userName }}</div>
        <p class="dc-menu-note">Signed in with Dear Crisis</p>
        <a v-if="memberProfile" class="dc-menu-link" :href="memberProfile">Your profile on Dear Crisis →</a>
        <a class="dc-menu-link dc-menu-quiet" href="/">Open the Dear Crisis app</a>
        <button class="dc-menu-signout" @click="signOutEverywhere">Sign out</button>
        <p class="dc-menu-fine">Signs you out of the Dear Crisis app on this device too.</p>
      </div>
    </div>
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
import { BASE, viaDearCrisis, forgetMe } from "./dcSession";

export default {
  components: { ProfilePanel },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const userName = ref(localStorage.getItem("dc_user_name") || "");
    const profileOpen = ref(false);
    const profileHeadshot = ref("");
    const memberOpen = ref(false);
    // signed in through the Dear Crisis app (dcSession.ts): the app's photo and profile page
    const isMember = ref(viaDearCrisis());
    const memberPhoto = ref(localStorage.getItem("dc_person_photo") || "");
    const memberProfile = ref(localStorage.getItem("dc_person_profile") || "");

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
      () => {
        userName.value = localStorage.getItem("dc_user_name") || "";
        isMember.value = viaDearCrisis();
        memberPhoto.value = localStorage.getItem("dc_person_photo") || "";
        memberProfile.value = localStorage.getItem("dc_person_profile") || "";
      }
    );

    const signOut = () => {
      localStorage.removeItem("dc_user_name");
      localStorage.removeItem("dc_record_id");
      userName.value = "";
      router.push("/login");
    };

    const signOutEverywhere = () => {
      forgetMe(true);
      memberOpen.value = false;
      isMember.value = false;
      userName.value = "";
      router.push("/login");
    };

    const onProfileLogout = () => {
      userName.value = "";
      profileOpen.value = false;
      router.push("/login");
    };

    return {
      base: BASE,
      userName, isLoginPage, isParticipant, avatarInitials,
      profileOpen, profileHeadshot,
      isMember, memberOpen, memberPhoto, memberProfile,
      signOut, signOutEverywhere, onProfileLogout,
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

/* the member menu: a Dear Crisis member's photo, their profile on the app, and one sign-out for both.
   In the app's own dark theme (the variables above). */
.dc-menu {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: flex-start; justify-content: flex-end;
  padding: 64px 16px 16px;
}
.dc-menu-card {
  position: relative;
  width: 100%; max-width: 300px;
  background: #161616; color: var(--text);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-hover);
  padding: 24px 20px 18px;
  text-align: center;
  font-family: var(--font-body);
}
.dc-menu-close {
  position: absolute; top: 8px; right: 10px;
  border: 0; background: none; font-size: 22px; line-height: 1; cursor: pointer; color: var(--text-secondary);
}
.dc-menu-photo {
  width: 72px; height: 72px; border-radius: 50%; object-fit: cover;
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
}
.dc-menu-initials { background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 22px; }
.dc-menu-name { font-family: var(--font-display); font-weight: 700; font-size: 19px; color: var(--text); }
.dc-menu-note { font-size: 13px; color: var(--text-secondary); margin: 4px 0 16px; }
.dc-menu-link {
  display: block; padding: 11px 12px; border-radius: var(--radius-xs);
  background: var(--accent); color: #fff; text-decoration: none; font-weight: 600; font-size: 14px;
  margin-bottom: 8px;
}
.dc-menu-link:hover { background: var(--accent-hover); }
.dc-menu-quiet { background: transparent; color: var(--text); box-shadow: 0 0 0 1px var(--border-hover); font-weight: 500; }
.dc-menu-quiet:hover { background: var(--surface-hover); }
.dc-menu-signout {
  margin-top: 6px; width: 100%; padding: 10px 12px; border-radius: var(--radius-xs);
  border: 0; background: transparent; color: var(--accent); font-weight: 600; font-size: 14px; cursor: pointer;
}
.dc-menu-fine { font-size: 11.5px; color: var(--text-dim); margin-top: 2px; }
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
