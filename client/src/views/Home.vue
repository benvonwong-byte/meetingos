<template>
  <div class="home">
    <!-- Hero -->
    <div class="hero-section">
      <div class="hero-grid" aria-hidden="true">
        <div v-for="i in 42" :key="i" class="grid-cell" :class="{ lit: litCells.includes(i) }"></div>
      </div>
      <div class="hero">
        <div class="hero-tag">Community Scheduling Assistant</div>
        <h1 class="hero-title">Find the time<br /><em>everyone</em> can meet.</h1>
        <p class="hero-sub">Create an event, share the link, see when everyone's free.</p>
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

        <!-- Step 1 -->
        <div class="feature-row">
          <div class="feature-text">
            <div class="feat-num">01</div>
            <h2 class="feat-title">Create your event</h2>
            <p class="feat-desc">Name your meeting, pick a date range, and choose a time window — morning, afternoon, or evening. Takes 20 seconds.</p>
          </div>
          <div class="feature-visual">
            <div class="mock-form">
              <div class="mock-field">
                <div class="mock-label">Event Name</div>
                <div class="mock-input">Metacrisis Salon planning call<span class="mock-cursor"></span></div>
              </div>
              <div class="mock-windows">
                <div class="mock-win">Morning</div>
                <div class="mock-win active">Afternoon</div>
                <div class="mock-win">Evening</div>
              </div>
              <div class="mock-btn">Create Event →</div>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="feature-row reverse">
          <div class="feature-text">
            <div class="feat-num">02</div>
            <h2 class="feat-title">Share the link</h2>
            <p class="feat-desc">Hit <strong>Share</strong> and send the URL to your group. Anyone with the link can participate — no account, no download, no friction.</p>
          </div>
          <div class="feature-visual">
            <div class="mock-share">
              <div class="mock-url">
                <span class="url-dim">meeting.dearcrisis.com/</span><span class="url-id">e8f3a2</span>
              </div>
              <div class="mock-copy-row">
                <div class="mock-copy-btn">⬆ Share — Copy link</div>
              </div>
              <div class="mock-avatars">
                <div class="mock-av" style="background:rgba(232,93,74,.2);border-color:rgba(232,93,74,.35)">BV</div>
                <div class="mock-av" style="background:rgba(100,200,140,.15);border-color:rgba(100,200,140,.3)">HE</div>
                <div class="mock-av" style="background:rgba(120,160,255,.15);border-color:rgba(120,160,255,.3)">MK</div>
                <div class="mock-av-more">+4</div>
                <span class="mock-av-label">joined</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="feature-row">
          <div class="feature-text">
            <div class="feat-num">03</div>
            <h2 class="feat-title">Mark when you're free</h2>
            <p class="feat-desc">In <strong>Edit</strong> mode, tap or drag across the calendar to highlight your available times. Green blocks mean you're in.</p>
          </div>
          <div class="feature-visual">
            <div class="mock-cal">
              <div class="mock-cal-head">
                <span v-for="d in ['FRI','SAT','SUN','MON','TUE']" :key="d" class="mc-day">{{ d }}</span>
              </div>
              <div class="mock-cal-body">
                <div v-for="row in calRows" :key="row" class="mc-row">
                  <div
                    v-for="col in 5" :key="col"
                    class="mc-cell"
                    :class="getCellClass(row, col)"
                  ></div>
                </div>
              </div>
              <div class="mock-drag-hint">← drag to select</div>
            </div>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="feature-row reverse">
          <div class="feature-text">
            <div class="feat-num">04</div>
            <h2 class="feat-title">Find the best overlap</h2>
            <p class="feat-desc">Switch to <strong>View</strong> mode. Darker green = more people free. Hover any slot to see exactly who's available.</p>
          </div>
          <div class="feature-visual">
            <div class="mock-view">
              <div class="mock-view-cal">
                <div v-for="row in calRows" :key="row" class="mc-row">
                  <div
                    v-for="col in 5" :key="col"
                    class="mc-cell"
                    :style="getViewStyle(row, col)"
                  ></div>
                </div>
              </div>
              <div class="mock-inspect">
                <span class="mi-time">2:00 PM</span>
                <span class="mi-count">3<span class="mi-of">/4</span></span>
                <div class="mi-names">
                  <span class="mi-chip">BV</span>
                  <span class="mi-chip">HE</span>
                  <span class="mi-chip">MK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <router-link :to="{ name: 'newevent' }" class="how-cta">
          Get started — Create an Event →
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Home",
  data() {
    return {
      litCells: [],
      calRows: [1, 2, 3, 4, 5, 6],
      // [row][col] → 0=empty, 1=selected(yours), 2=partial, 3=full
      calData: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      viewData: [
        [0, 0.25, 0,    0.25, 0],
        [0, 0.5,  0.75, 0.5,  0],
        [0, 0.75, 1,    0.75, 0.25],
        [0, 0.5,  1,    1,    0.5],
        [0, 0.25, 0.75, 0.5,  0.25],
        [0, 0,    0.25, 0,    0],
      ],
    };
  },
  mounted() { this.animateGrid(); },
  beforeUnmount() { clearTimeout(this._gridTimer); },
  methods: {
    animateGrid() {
      const update = () => {
        const count = Math.floor(Math.random() * 10) + 6;
        this.litCells = Array.from({ length: count }, () => Math.floor(Math.random() * 42) + 1);
        this._gridTimer = setTimeout(update, 800 + Math.random() * 700);
      };
      update();
    },
    getCellClass(row, col) {
      const v = this.calData[row - 1][col - 1];
      return { 'mc-sel': v === 1, 'mc-partial': v === 2, 'mc-full': v === 3 };
    },
    getViewStyle(row, col) {
      const ratio = this.viewData[row - 1][col - 1];
      if (!ratio) return {};
      const curved = Math.pow(ratio, 1.5);
      const s = Math.round(15 + curved * 70);
      const l = Math.round(68 - curved * 38);
      const a = 0.12 + curved * 0.83;
      return { backgroundColor: `hsla(145, ${s}%, ${l}%, ${a})` };
    },
  },
};
</script>

<style lang="scss" scoped>
.home { display: flex; flex-direction: column; }

/* ── Hero ───────────────────────────────────────── */
.hero-section {
  position: relative; min-height: calc(100vh - 65px);
  display: flex; align-items: center; justify-content: center;
  padding: 60px 24px 80px; overflow: hidden;
}
.hero-grid {
  position: absolute; inset: 0;
  display: grid; grid-template-columns: repeat(7,1fr); grid-template-rows: repeat(6,1fr);
  gap: 3px; padding: 3px; pointer-events: none; z-index: 0;
}
.grid-cell {
  border-radius: 6px; background: rgba(245,240,232,.03); border: 1px solid rgba(245,240,232,.05);
  transition: background .7s ease, border-color .7s ease;
  &.lit { background: rgba(232,93,74,.18); border-color: rgba(232,93,74,.3); }
}
.hero { position: relative; z-index: 2; text-align: center; max-width: 580px; }
.hero-tag {
  display: inline-block; font-size: .72rem; font-weight: 500; letter-spacing: .1em;
  text-transform: uppercase; color: var(--accent); background: var(--accent-soft);
  border: 1px solid rgba(232,93,74,.28); border-radius: 100px; padding: 5px 18px; margin-bottom: 28px;
}
.hero-title {
  font-family: var(--font-display); font-size: clamp(2.6rem,9vw,5rem);
  font-weight: 700; line-height: 1.08; letter-spacing: -.03em; color: var(--text); margin-bottom: 22px;
  em { font-style: italic; color: var(--accent); }
}
.hero-sub { font-size: 1rem; color: var(--text-secondary); line-height: 1.65; max-width: 380px; margin: 0 auto 40px; }
.cta-btn {
  display: inline-flex; align-items: center; gap: 10px; background: var(--accent); color: #fff;
  font-size: .95rem; font-weight: 500; padding: 14px 30px; border-radius: 100px;
  transition: background .2s, transform .2s, box-shadow .2s;
  box-shadow: 0 4px 24px rgba(232,93,74,.38);
  &:hover { background: var(--accent-hover); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(232,93,74,.5); .cta-arrow { transform: translateX(4px); } }
}
.cta-arrow { display: inline-block; transition: transform .2s; }
.scroll-hint {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  font-size: .7rem; letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim);
  z-index: 2; animation: bob 2s ease-in-out infinite;
}
@keyframes bob { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(5px); } }

/* ── How it works ────────────────────────────────── */
.how-section { background: rgba(245,240,232,.02); border-top: 1px solid var(--border); padding: 80px 24px 100px; }
.how-inner { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 0; }
.how-label {
  font-size: .7rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase;
  color: var(--text-dim); text-align: center; margin-bottom: 72px;
}

/* Feature rows */
.feature-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;
  padding: 56px 0; border-bottom: 1px solid var(--border);
  &:last-of-type { border-bottom: none; }
  &.reverse { direction: rtl; > * { direction: ltr; } }
  @media (max-width: 720px) {
    grid-template-columns: 1fr; gap: 28px; direction: ltr !important;
    > * { direction: ltr !important; }
  }
}

.feat-num {
  font-family: var(--font-display); font-size: .72rem; font-weight: 700;
  letter-spacing: .14em; color: var(--accent); margin-bottom: 10px;
}
.feat-title {
  font-family: var(--font-display); font-size: clamp(1.4rem,3vw,2rem);
  font-weight: 700; letter-spacing: -.03em; color: var(--text); margin-bottom: 14px; line-height: 1.1;
}
.feat-desc {
  font-size: .9rem; color: var(--text-secondary); line-height: 1.65; max-width: 360px;
  strong { color: var(--text); }
}

/* ── Mock visuals ────────────────────────────────── */
.feature-visual {
  display: flex; justify-content: center; align-items: center;
}

/* Mock form (step 1) */
.mock-form {
  background: rgba(22,22,22,.9); border: 1px solid var(--border-hover);
  border-radius: 16px; padding: 20px; width: 100%; max-width: 300px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 24px 60px rgba(0,0,0,.5);
}
.mock-label { font-size: .6rem; letter-spacing: .1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 4px; }
.mock-input {
  background: rgba(245,240,232,.05); border: 1px solid var(--border-hover);
  border-radius: 8px; padding: 9px 12px; font-size: .78rem; color: var(--text);
}
.mock-cursor {
  display: inline-block; width: 1px; height: 12px; background: var(--accent);
  margin-left: 2px; vertical-align: middle; animation: blink 1s step-end infinite;
}
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
.mock-windows { display: flex; gap: 4px; }
.mock-win {
  flex: 1; text-align: center; padding: 7px 4px; border-radius: 8px;
  font-size: .7rem; color: var(--text-dim); background: rgba(245,240,232,.04);
  border: 1px solid var(--border);
  &.active { background: var(--accent-soft); border-color: rgba(232,93,74,.4); color: var(--accent); font-weight: 600; }
}
.mock-btn {
  background: var(--accent); color: #fff; border-radius: 8px; padding: 10px;
  font-size: .78rem; font-weight: 600; text-align: center;
}

/* Mock share (step 2) */
.mock-share {
  background: rgba(22,22,22,.9); border: 1px solid var(--border-hover);
  border-radius: 16px; padding: 20px; width: 100%; max-width: 300px;
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 24px 60px rgba(0,0,0,.5);
}
.mock-url {
  background: rgba(245,240,232,.04); border: 1px solid var(--border);
  border-radius: 8px; padding: 9px 12px; font-size: .72rem;
}
.url-dim { color: var(--text-dim); }
.url-id { color: var(--accent); font-weight: 600; }
.mock-copy-row { display: flex; }
.mock-copy-btn {
  flex: 1; text-align: center; padding: 9px; border-radius: 8px; font-size: .75rem; font-weight: 600;
  background: rgba(245,240,232,.07); border: 1px solid var(--border-hover); color: var(--text-secondary);
}
.mock-avatars { display: flex; align-items: center; gap: 6px; }
.mock-av {
  width: 28px; height: 28px; border-radius: 50%; border: 1px solid; display: flex;
  align-items: center; justify-content: center; font-size: .58rem; font-weight: 700; color: var(--text);
}
.mock-av-more {
  font-size: .7rem; color: var(--text-dim); background: rgba(245,240,232,.06);
  border: 1px solid var(--border); border-radius: 50%; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
}
.mock-av-label { font-size: .72rem; color: var(--text-secondary); margin-left: 2px; }

/* Mock calendar (steps 3 & 4) */
.mock-cal, .mock-view-cal {
  background: rgba(22,22,22,.9); border: 1px solid var(--border-hover);
  border-radius: 16px; overflow: hidden; width: 100%; max-width: 300px;
  box-shadow: 0 24px 60px rgba(0,0,0,.5);
}
.mock-cal { padding-bottom: 10px; }
.mock-cal-head {
  display: flex; border-bottom: 1px solid var(--border); background: rgba(245,240,232,.03);
}
.mc-day {
  flex: 1; text-align: center; padding: 8px 0;
  font-size: .58rem; letter-spacing: .08em; color: var(--text-dim); text-transform: uppercase;
}
.mock-cal-body, .mock-view-cal { }
.mc-row { display: flex; }
.mc-cell {
  flex: 1; height: 28px;
  border-right: 1px solid rgba(245,240,232,.05);
  border-bottom: 1px solid rgba(245,240,232,.05);
  background: rgba(245,240,232,.02);
  &:last-child { border-right: none; }
  &.mc-sel { background: hsla(145,55%,52%,.65); }
  &.mc-partial { background: hsla(145,35%,60%,.3); }
  &.mc-full { background: hsla(145,75%,40%,.85); }
}
.mock-drag-hint {
  text-align: center; font-size: .62rem; color: var(--text-dim);
  padding: 8px; letter-spacing: .06em;
}

/* View mock with inspect bar */
.mock-view { display: flex; flex-direction: column; gap: 0; width: 100%; max-width: 300px; }
.mock-view-cal { border-radius: 16px 16px 0 0; border-bottom: none; }
.mock-inspect {
  background: rgba(14,14,14,.98); border: 1px solid var(--border-hover);
  border-radius: 0 0 16px 16px; padding: 10px 14px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 24px 60px rgba(0,0,0,.5);
}
.mi-time { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text); white-space: nowrap; }
.mi-count { font-size: 1rem; font-weight: 700; color: rgba(100,200,140,.9); font-family: var(--font-display); white-space: nowrap; }
.mi-of { font-size: .72rem; opacity: .55; }
.mi-names { display: flex; gap: 5px; flex-wrap: wrap; }
.mi-chip {
  padding: 2px 8px; border-radius: 100px; font-size: .65rem; font-weight: 600;
  background: rgba(100,200,140,.12); border: 1px solid rgba(100,200,140,.25); color: rgba(100,200,140,.9);
}

/* Final CTA */
.how-cta {
  align-self: center; margin-top: 64px;
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent); color: #fff;
  font-size: .95rem; font-weight: 500; padding: 14px 28px; border-radius: 100px;
  box-shadow: 0 4px 24px rgba(232,93,74,.35);
  transition: background .2s, transform .2s;
  &:hover { background: var(--accent-hover); transform: translateY(-2px); }
}
</style>
