<template>
  <div class="home">
    <!-- Hero section fills viewport -->
    <div class="hero-section">
      <div class="hero-grid" aria-hidden="true">
        <div
          v-for="i in 42"
          :key="i"
          class="grid-cell"
          :class="{ lit: litCells.includes(i) }"
        ></div>
      </div>
      <div class="hero">
        <div class="hero-tag">Community Scheduling Assistant</div>
        <h1 class="hero-title">
          Find the time<br />
          <em>everyone</em> can meet.
        </h1>
        <p class="hero-sub">
          Create an event, share the link, see when everyone's free.
        </p>
        <router-link :to="{ name: 'newevent' }" class="cta-btn">
          Create an Event <span class="cta-arrow">→</span>
        </router-link>
      </div>
      <div class="scroll-hint" aria-hidden="true">How it works ↓</div>
    </div>

    <!-- How it works -->
    <div class="how-section">
      <div class="how-inner">
        <p class="how-label">How it works</p>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-body">
              <div class="step-title">Create an event</div>
              <p class="step-desc">Pick a name, choose your dates and time window — morning, afternoon, or evening.</p>
            </div>
          </div>
          <div class="step-divider">→</div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-body">
              <div class="step-title">Share the link</div>
              <p class="step-desc">Send the event URL to your group. Everyone opens it — no account needed.</p>
            </div>
          </div>
          <div class="step-divider">→</div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-body">
              <div class="step-title">Mark your availability</div>
              <p class="step-desc">In <strong>Edit</strong> mode, tap or drag the calendar to show when you're free.</p>
            </div>
          </div>
          <div class="step-divider">→</div>
          <div class="step">
            <div class="step-num">4</div>
            <div class="step-body">
              <div class="step-title">Find the overlap</div>
              <p class="step-desc">Switch to <strong>View</strong> mode — darker green means more people are free at that time.</p>
            </div>
          </div>
        </div>
        <router-link :to="{ name: 'newevent' }" class="how-cta">
          Get started → Create an Event
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return { litCells: [] };
  },
  mounted() {
    this.animateGrid();
  },
  beforeUnmount() {
    clearTimeout(this._gridTimer);
  },
  methods: {
    animateGrid() {
      const update = () => {
        const count = Math.floor(Math.random() * 10) + 6;
        this.litCells = Array.from({ length: count }, () =>
          Math.floor(Math.random() * 42) + 1
        );
        this._gridTimer = setTimeout(update, 800 + Math.random() * 700);
      };
      update();
    },
  },
};
</script>

<style lang="scss" scoped>
.home { display: flex; flex-direction: column; }

/* ── Hero ───────────────────────────────────────── */
.hero-section {
  position: relative;
  min-height: calc(100vh - 65px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px 80px;
  overflow: hidden;
}

.hero-grid {
  position: absolute; inset: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 3px; padding: 3px;
  pointer-events: none; z-index: 0;
}

.grid-cell {
  border-radius: 6px;
  background: rgba(245, 240, 232, 0.03);
  border: 1px solid rgba(245, 240, 232, 0.05);
  transition: background 0.7s ease, border-color 0.7s ease;
  &.lit { background: rgba(232, 93, 74, 0.18); border-color: rgba(232, 93, 74, 0.3); }
}

.hero {
  position: relative; z-index: 2;
  text-align: center; max-width: 580px;
}

.hero-tag {
  display: inline-block; font-size: 0.72rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--accent); background: var(--accent-soft);
  border: 1px solid rgba(232, 93, 74, 0.28);
  border-radius: 100px; padding: 5px 18px; margin-bottom: 28px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 9vw, 5rem);
  font-weight: 700; line-height: 1.08; letter-spacing: -0.03em;
  color: var(--text); margin-bottom: 22px;
  em { font-style: italic; color: var(--accent); }
}

.hero-sub {
  font-size: 1rem; color: var(--text-secondary);
  line-height: 1.65; max-width: 380px;
  margin: 0 auto 40px;
}

.cta-btn {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--accent); color: #fff;
  font-size: 0.95rem; font-weight: 500;
  padding: 14px 30px; border-radius: 100px;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 24px rgba(232, 93, 74, 0.38);
  &:hover {
    background: var(--accent-hover); transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(232, 93, 74, 0.5);
    .cta-arrow { transform: translateX(4px); }
  }
}
.cta-arrow { display: inline-block; transition: transform 0.2s; }

.scroll-hint {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  font-size: .7rem; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-dim); z-index: 2; animation: bob 2s ease-in-out infinite;
}
@keyframes bob { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(4px); } }

/* ── How it works ────────────────────────────────── */
.how-section {
  background: rgba(245,240,232,.02);
  border-top: 1px solid var(--border);
  padding: 72px 24px 80px;
}

.how-inner {
  max-width: 900px; margin: 0 auto;
  display: flex; flex-direction: column; align-items: center; gap: 40px;
}

.how-label {
  font-size: .7rem; font-weight: 600; letter-spacing: .14em;
  text-transform: uppercase; color: var(--text-dim); text-align: center;
}

.steps {
  display: flex; align-items: flex-start; gap: 0;
  width: 100%;
  @media (max-width: 680px) { flex-direction: column; gap: 0; }
}

.step {
  flex: 1; display: flex; flex-direction: column; gap: 10px;
  background: var(--surface); border: 1px solid var(--border);
  padding: 22px 20px; border-right: none;
  &:first-of-type { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
  &:last-of-type  { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; border-right: 1px solid var(--border); }
  @media (max-width: 680px) {
    border-right: 1px solid var(--border); border-bottom: none;
    border-radius: 0 !important;
    &:first-of-type { border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important; }
    &:last-of-type  { border-radius: 0 0 var(--radius-sm) var(--radius-sm) !important; border-bottom: 1px solid var(--border); }
  }
}

.step-divider {
  display: flex; align-items: center; justify-content: center;
  width: 28px; flex-shrink: 0; padding-top: 34px;
  font-size: .75rem; color: var(--text-dim);
  @media (max-width: 680px) {
    width: 100%; height: 24px; padding-top: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-top: none; border-bottom: none;
    writing-mode: horizontal-tb;
    transform: rotate(90deg) scaleX(0.7);
  }
}

.step-num {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent-soft); border: 1px solid rgba(232,93,74,.3);
  color: var(--accent); font-size: .75rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.step-title { font-size: .88rem; font-weight: 600; color: var(--text); }
.step-desc {
  font-size: .78rem; color: var(--text-secondary); line-height: 1.55;
  strong { color: var(--text); }
}

.how-cta {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: .85rem; font-weight: 500; color: var(--text-secondary);
  background: rgba(245,240,232,.06); border: 1px solid var(--border-hover);
  border-radius: 100px; padding: 10px 22px;
  transition: background .2s, color .2s;
  &:hover { background: rgba(245,240,232,.12); color: var(--text); }
}
</style>
