<template>
  <div class="event-page">

    <div class="event-header">
      <div class="event-header-left">
        <h1 class="event-name">{{ eventName }}</h1>
        <div class="date-nav">
          <button class="date-nav-btn" @click="page !== 0 && page--" :disabled="page === 0">‹</button>
          <span class="date-label">{{ eventRange }}</span>
          <button class="date-nav-btn" @click="page !== pageNumbers && page++" :disabled="page === pageNumbers">›</button>
        </div>
      </div>

      <div class="header-actions">
        <div class="mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: !viewMode }"
            @click="viewMode = false"
            title="Edit your availability"
          >✏ Edit</button>
          <button
            class="mode-btn"
            :class="{ active: viewMode }"
            @click="viewMode = true"
            title="Inspect who's free"
          >👁 View</button>
        </div>
        <button class="clear-btn" @click="clearAll" v-if="!viewMode">✕ Clear</button>
        <button class="share-btn" @click="shareLink" :class="{ copied }">
          <span v-if="!copied">⬆ Share</span>
          <span v-else>✓ Copied!</span>
        </button>
        <button class="help-btn" @click="showHelp = true" title="How this works">?</button>
      </div>
    </div>

    <!-- Help modal -->
    <transition name="modal-fade">
      <div class="help-overlay" v-if="showHelp" @click.self="showHelp = false">
        <div class="help-modal">
          <button class="help-close" @click="showHelp = false">✕</button>
          <h2 class="help-title">How it works</h2>
          <div class="help-steps">
            <div class="help-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-name">Share this link</div>
                <p class="step-desc">Copy the URL from your browser and send it to everyone you want to schedule with.</p>
              </div>
            </div>
            <div class="help-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-name">Everyone marks when they're free</div>
                <p class="step-desc">In <strong>Edit</strong> mode, tap or drag across the calendar blocks to highlight your available times. Green = available.</p>
              </div>
            </div>
            <div class="help-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-name">Find the best overlap</div>
                <p class="step-desc">Switch to <strong>View</strong> mode and hover over the calendar. Darker green means more people are free. Tap any slot to see who's in.</p>
              </div>
            </div>
          </div>
          <button class="help-share-cta" @click="shareLink(); showHelp = false">
            <span v-if="!copied">⬆ Copy link to share</span>
            <span v-else>✓ Link copied!</span>
          </button>
        </div>
      </div>
    </transition>

    <div class="mode-hint" v-if="!viewMode">
      Tap or drag blocks to mark when you're available
    </div>
    <div class="mode-hint view" v-if="viewMode">
      Hover or drag to see who's free · <span class="hint-count">{{ participantCount }} participants</span>
    </div>

    <div class="event-body">
      <div class="calendar-wrap">
        <Calendar :page="page" :view-mode="viewMode" @inspect="openInspect" />
      </div>
      <aside class="sidebar">
        <!-- Inline inspect card (desktop only, replaces fixed bottom bar) -->
        <div class="inspect-card" v-if="viewMode">
          <template v-if="inspectedSlot">
            <div class="ic-header">
              <div class="ic-time-block">
                <span class="ic-time">{{ inspectedSlot.timeLabel }}</span>
                <span class="ic-date">{{ inspectedSlot.dateLabel }}</span>
              </div>
              <div class="ic-badge">
                {{ inspectedSlot.names.length }}<span class="ic-of">/{{ participantCount }}</span>
              </div>
            </div>
            <div class="ic-names" v-if="inspectedSlot.names.length > 0">
              <div v-for="name in inspectedSlot.names" :key="name" class="ic-person">
                <div class="ic-avatar">{{ initials(name) }}</div>
                <span class="ic-name">{{ name }}</span>
              </div>
            </div>
            <div class="ic-empty" v-else>No one available</div>
          </template>
          <div class="ic-placeholder" v-else>Hover a time slot to see who's free</div>
        </div>
        <Participants />
        <EventDetails />
      </aside>
    </div>
  </div>

  <!-- Persistent inspect panel — slides up from bottom, mobile only -->
  <transition name="panel-slide">
    <div class="inspect-panel" v-if="viewMode && inspectedSlot">
      <div class="panel-inner">
        <div class="panel-time-block">
          <span class="panel-time">{{ inspectedSlot.timeLabel }}</span>
          <span class="panel-date">{{ inspectedSlot.dateLabel }}</span>
        </div>
        <div class="panel-count-badge">
          {{ inspectedSlot.names.length }}<span class="panel-count-of">/{{ participantCount }}</span>
        </div>
        <div class="panel-names" v-if="inspectedSlot.names.length > 0">
          <div v-for="name in inspectedSlot.names" :key="name" class="panel-person">
            <div class="panel-avatar">{{ initials(name) }}</div>
            <span class="panel-name">{{ name }}</span>
          </div>
        </div>
        <div class="panel-empty" v-else>No one available</div>
      </div>
    </div>
  </transition>
</template>

<script>
import Calendar from "../components/Calendar.vue";
import Participants from "../components/Participants";
import EventDetails from "../components/EventDetails";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { computed, ref, watch } from "vue";
import { ActionTypes } from "../store/actions";

export default {
  components: { Calendar, Participants, EventDetails },
  setup() {
    const store = useStore();
    const route = useRoute();
    const page = ref(0);
    const viewMode = ref(false);
    const inspectedSlot = ref(null);
    const showHelp = ref(false);
    const copied = ref(false);

    // Auto-register once event data loads, no modal needed
    watch(
      () => store.state.eventData._id,
      (eventID) => {
        if (!eventID) return;
        const name = localStorage.getItem("dc_user_name");
        if (!name || localStorage.getItem(String(eventID))) return;
        store.dispatch(ActionTypes.addUserName, { username: name, eventID: route.params.id });
      },
      { immediate: true }
    );

    const clearAll = () => store.dispatch("REMOVE_SELF_AVAILABILITY");

    const shareLink = () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2200);
      });
    };
    const participantCount = computed(() => store.state.eventData?.users?.length || 0);

    watch(viewMode, (val) => {
      if (!val) {
        inspectedSlot.value = null;
        store.dispatch("UPDATE_HOVER", "MouseOut");
      }
    });

    const openInspect = ({ hour }) => {
      if (!hour) { inspectedSlot.value = null; return; }

      const avail = store.getters.getAvailability;
      const users = store.state.eventData?.users || [];
      const ids = avail[hour] || [];
      const names = ids
        .map((id) => { const u = users.find((u) => u.id === id); return u ? u.name : null; })
        .filter(Boolean);

      const ts = parseInt(hour) * 1000;
      const d = new Date(ts);
      const h = d.getHours();
      const timeLabel = `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
      const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      inspectedSlot.value = { hour, names, timeLabel, dateLabel };
      store.dispatch("UPDATE_HOVER", hour);
    };

    const initials = (name) =>
      name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

    return {
      clearAll, page, viewMode, inspectedSlot, participantCount,
      showHelp, copied, shareLink,
      openInspect, initials,
      eventRange: computed(() => store.getters.getTopLabel),
      pageNumbers: computed(() => store.getters.getPageNumbers),
      eventName: computed(() => store.getters.getEventName),
    };
  },
};
</script>

<style lang="scss" scoped>
.event-page {
  padding: 24px 24px 40px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 600px) { padding: 16px 14px 40px; }
}

.event-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  text-align: center;
}

.event-header-left { display: flex; flex-direction: column; align-items: center; gap: 10px; }

.event-name {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 4vw, 2.2rem);
  font-weight: 700;
  letter-spacing: -.03em;
  color: var(--text);
  line-height: 1.1;
}

.date-nav { display: flex; align-items: center; gap: 4px; }
.date-nav-btn {
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xs);
  color: var(--text); font-size: 1.3rem; transition: background .2s, border-color .2s;
  &:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--border-hover); }
  &:disabled { opacity: .3; cursor: not-allowed; }
}
.date-label {
  padding: 0 12px; font-size: .88rem; color: var(--text-secondary);
  min-width: 160px; text-align: center;
}

.header-actions { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }

.mode-toggle {
  display: flex; border: 1px solid var(--border); border-radius: var(--radius-xs); overflow: hidden;
}
.mode-btn {
  padding: 8px 14px; font-size: .8rem; font-weight: 500;
  background: none; border: none; color: var(--text-secondary); cursor: pointer;
  transition: background .15s, color .15s;
  &:hover { background: rgba(245,240,232,.06); }
  &.active { background: var(--accent-soft); color: var(--accent); }
}

.clear-btn {
  display: flex; align-items: center; gap: 5px; padding: 8px 14px;
  background: rgba(232,93,74,.1); border: 1px solid rgba(232,93,74,.25);
  border-radius: var(--radius-xs); color: var(--accent); font-size: .82rem; font-weight: 500;
  transition: background .2s, border-color .2s;
  &:hover { background: rgba(232,93,74,.2); }
}

.mode-hint {
  font-size: .78rem; color: var(--text-dim); margin-bottom: 14px;
  padding: 7px 14px; background: rgba(245,240,232,.04);
  border: 1px solid var(--border); border-radius: var(--radius-xs);
  text-align: center;
  &.view { border-color: rgba(100,200,140,.2); background: rgba(100,200,140,.04); }
}
.hint-count { color: var(--text-secondary); font-weight: 500; }

.event-body {
  display: flex; gap: 20px; align-items: flex-start;
  @media (max-width: 768px) { flex-direction: column; align-items: stretch; }
}
.calendar-wrap { flex: 1; min-width: 0; overflow-x: hidden; width: 100%; }
.sidebar {
  width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px;
  position: sticky; top: 24px; align-self: flex-start;
  @media (max-width: 768px) { width: 100%; position: static; align-self: auto; }
}

/* ── Desktop inline inspect card (sidebar) ────────────────── */
.inspect-card {
  display: none;
  @media (min-width: 769px) {
    display: block;
    background: var(--surface);
    border: 1px solid rgba(100,200,140,.2);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
  }
}
.ic-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.ic-time-block { display: flex; flex-direction: column; }
.ic-time {
  font-family: var(--font-display); font-size: 1.1rem; font-weight: 700;
  letter-spacing: -.02em; color: var(--text); line-height: 1.1;
}
.ic-date { font-size: .65rem; color: var(--text-secondary); margin-top: 2px; }
.ic-badge {
  font-size: 1.1rem; font-weight: 700; color: rgba(100,200,140,.9);
  font-family: var(--font-display); letter-spacing: -.02em; white-space: nowrap;
}
.ic-of { font-size: .75rem; opacity: .55; }
.ic-names { display: flex; flex-direction: column; gap: 3px; }
.ic-person { display: flex; align-items: center; gap: 6px; padding: 3px 0; }
.ic-avatar {
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  background: rgba(100,200,140,.18); border: 1px solid rgba(100,200,140,.3);
  color: rgba(100,200,140,.9); font-size: .52rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.ic-name { font-size: .78rem; color: var(--text); }
.ic-empty, .ic-placeholder { font-size: .78rem; color: var(--text-dim); }

/* ── Inspect panel (fixed bottom, mobile only) ────────────── */
.inspect-panel {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(16, 16, 16, 0.97);
  border-top: 1px solid var(--border-hover);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 12px 20px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  @media (min-width: 769px) { display: none; }
}

.panel-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.panel-time-block {
  display: flex;
  flex-direction: column;
  min-width: 110px;
}

.panel-time {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -.02em;
  color: var(--text);
  line-height: 1.1;
}

.panel-date {
  font-size: .7rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.panel-count-badge {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-display);
  letter-spacing: -.02em;
  white-space: nowrap;
}
.panel-count-of {
  font-size: .85rem;
  opacity: .55;
}

.panel-names {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.panel-person {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(245,240,232,.06);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 3px 10px 3px 4px;
}

.panel-avatar {
  width: 20px; height: 20px;
  border-radius: 50%; flex-shrink: 0;
  background: rgba(100,200,140,.18);
  border: 1px solid rgba(100,200,140,.3);
  color: rgba(100,200,140,.9);
  font-size: .58rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.panel-name { font-size: .78rem; color: var(--text); white-space: nowrap; }
.panel-empty { font-size: .82rem; color: var(--text-dim); }

.panel-slide-enter-active,
.panel-slide-leave-active { transition: transform .2s ease, opacity .2s ease; }
.panel-slide-enter-from,
.panel-slide-leave-to     { transform: translateY(100%); opacity: 0; }

/* ── Share & Help buttons ────────────────────────────────── */
.share-btn {
  display: flex; align-items: center; gap: 5px; padding: 8px 14px;
  background: rgba(245,240,232,.06); border: 1px solid var(--border-hover);
  border-radius: var(--radius-xs); color: var(--text-secondary); font-size: .82rem; font-weight: 500;
  transition: background .2s, border-color .2s, color .2s;
  white-space: nowrap;
  &:hover { background: rgba(245,240,232,.12); color: var(--text); }
  &.copied { background: rgba(100,200,140,.12); border-color: rgba(100,200,140,.3); color: rgba(100,200,140,.9); }
}

.help-btn {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: rgba(245,240,232,.06); border: 1px solid var(--border-hover);
  color: var(--text-dim); font-size: .88rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  transition: background .2s, color .2s, border-color .2s;
  &:hover { background: rgba(245,240,232,.14); color: var(--text); border-color: rgba(245,240,232,.3); }
}

/* ── Help modal ───────────────────────────────────────────── */
.help-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(0,0,0,.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}

.help-modal {
  width: 100%; max-width: 420px;
  background: rgba(20,20,20,.98);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius);
  padding: 32px 28px 24px;
  position: relative;
  box-shadow: 0 32px 80px rgba(0,0,0,.7);
}

.help-close {
  position: absolute; top: 16px; right: 16px;
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(245,240,232,.08); border: 1px solid var(--border);
  color: var(--text-dim); font-size: .78rem;
  display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s;
  &:hover { background: rgba(245,240,232,.16); color: var(--text); }
}

.help-title {
  font-family: var(--font-display); font-size: 1.6rem; font-weight: 700;
  letter-spacing: -.03em; color: var(--text); margin-bottom: 24px;
}

.help-steps { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; }

.help-step {
  display: flex; gap: 14px; align-items: flex-start;
}

.step-num {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent-soft); border: 1px solid rgba(232,93,74,.3);
  color: var(--accent); font-size: .78rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin-top: 1px;
}

.step-body { flex: 1; }
.step-name { font-size: .88rem; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.step-desc { font-size: .8rem; color: var(--text-secondary); line-height: 1.5; }
.step-desc strong { color: var(--text); }

.help-share-cta {
  width: 100%; padding: 12px; font-size: .88rem; font-weight: 600;
  background: rgba(245,240,232,.07); border: 1px solid var(--border-hover);
  border-radius: var(--radius-xs); color: var(--text); cursor: pointer;
  transition: background .2s;
  &:hover { background: rgba(245,240,232,.13); }
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>
