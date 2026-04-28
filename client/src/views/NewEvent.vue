<template>
  <div class="new-event-page">
    <div class="form-card">
      <div class="form-header">
        <h1 class="form-title">New Event</h1>
        <p class="form-subtitle">Name it, pick dates, choose a time window.</p>
      </div>

      <!-- Event title -->
      <div class="field">
        <label class="field-label">Event Name</label>
        <input
          type="text"
          v-model="name"
          placeholder="e.g. Metacrisis Salon planning call"
          class="text-input"
          :class="{ error: errors.name }"
          autocomplete="off"
        />
        <span class="field-error" v-if="errors.name">{{ errors.name }}</span>
      </div>

      <!-- Calendar date-range picker -->
      <div class="field">
        <label class="field-label">Date Range</label>
        <div class="calendar-picker" :class="{ error: errors.dates }">
          <!-- Month nav -->
          <div class="cal-header">
            <button class="cal-nav" @click="prevMonth" type="button">‹</button>
            <span class="cal-month">{{ monthLabel }}</span>
            <button class="cal-nav" @click="nextMonth" type="button">›</button>
          </div>
          <!-- Day-of-week labels -->
          <div class="cal-dow">
            <span v-for="d in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="d">{{ d }}</span>
          </div>
          <!-- Day cells -->
          <div class="cal-grid">
            <div
              v-for="cell in calCells"
              :key="cell.key"
              class="cal-cell"
              :class="{
                'other-month': !cell.inMonth,
                'past':         cell.past,
                'range-start':  cell.isStart,
                'range-end':    cell.isEnd,
                'in-range':     cell.inRange,
                'today':        cell.isToday,
              }"
              @click="cell.inMonth && !cell.past && selectDate(cell.date)"
            >
              <span v-if="cell.inMonth">{{ cell.day }}</span>
            </div>
          </div>
          <!-- Range summary -->
          <div class="cal-summary" v-if="startDate || endDate">
            <span class="cal-sum-item">
              <span class="cal-sum-label">From</span>
              <span class="cal-sum-val">{{ formatDate(startDate) || '—' }}</span>
            </span>
            <span class="cal-sum-sep">→</span>
            <span class="cal-sum-item">
              <span class="cal-sum-label">To</span>
              <span class="cal-sum-val">{{ formatDate(endDate) || 'pick end date' }}</span>
            </span>
            <button class="cal-clear" @click="clearDates" type="button">✕</button>
          </div>
        </div>
        <span class="field-error" v-if="errors.dates">{{ errors.dates }}</span>
      </div>

      <!-- Time windows (multi-select, contiguous) -->
      <div class="field">
        <label class="field-label">Time Windows</label>
        <div class="window-group">
          <button
            v-for="w in timeWindows"
            :key="w.id"
            type="button"
            class="window-btn"
            :class="{ active: selectedWindows.includes(w.id) }"
            @click="toggleWindow(w.id)"
          >
            <span class="window-label">{{ w.label }}</span>
            <span class="window-range">{{ w.range }}</span>
          </button>
        </div>
        <p class="window-summary" v-if="effectiveRange">{{ effectiveRange }}</p>
      </div>

      <button class="submit-btn" :disabled="loading" @click="submit">
        <span v-if="!loading">Create Event →</span>
        <span v-else class="loading-dots"><i></i><i></i><i></i></span>
      </button>
    </div>
  </div>
</template>

<script>
import { instance } from "../api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default {
  name: "NewEvent",
  data() {
    const now = new Date();
    return {
      name: "",
      selectedWindows: ["afternoon"],
      startDate: null,
      endDate: null,
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth(),
      loading: false,
      errors: {},
      timeWindows: [
        { id: "morning",   label: "Morning",   range: "6 AM – 12 PM" },
        { id: "afternoon", label: "Afternoon", range: "12 PM – 6 PM" },
        { id: "evening",   label: "Evening",   range: "6 PM – 12 AM" },
      ],
      _windowOrder: ["morning", "afternoon", "evening"],
    };
  },
  computed: {
    effectiveRange() {
      const order = this._windowOrder;
      const sorted = [...this.selectedWindows].sort((a, b) => order.indexOf(a) - order.indexOf(b));
      if (!sorted.length) return "";
      const starts = { morning: "6 AM", afternoon: "12 PM", evening: "6 PM" };
      const ends   = { morning: "12 PM", afternoon: "6 PM", evening: "12 AM" };
      return `${starts[sorted[0]]} – ${ends[sorted[sorted.length - 1]]}`;
    },
    monthLabel() {
      return `${MONTHS[this.viewMonth]} ${this.viewYear}`;
    },
    calCells() {
      const today = new Date(); today.setHours(0,0,0,0);
      const firstDay = new Date(this.viewYear, this.viewMonth, 1);
      const lastDay  = new Date(this.viewYear, this.viewMonth + 1, 0);
      const cells = [];
      // leading empty cells
      for (let i = 0; i < firstDay.getDay(); i++) {
        cells.push({ key: `pre-${i}`, inMonth: false, day: "" });
      }
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(this.viewYear, this.viewMonth, d);
        date.setHours(0,0,0,0);
        const isStart = this.startDate && date.getTime() === this.startDate.getTime();
        const isEnd   = this.endDate   && date.getTime() === this.endDate.getTime();
        const inRange = this.startDate && this.endDate &&
                        date > this.startDate && date < this.endDate;
        cells.push({
          key: `d-${d}`,
          inMonth: true,
          day: d,
          date,
          past: date < today,
          isToday: date.getTime() === today.getTime(),
          isStart,
          isEnd,
          inRange,
        });
      }
      return cells;
    },
  },
  methods: {
    toggleWindow(id) {
      const order = this._windowOrder;
      const cur = [...this.selectedWindows];
      if (cur.includes(id)) {
        if (cur.length === 1) return; // must keep at least one
        const sorted = [...cur].sort((a, b) => order.indexOf(a) - order.indexOf(b));
        // Only allow deselecting from the edges, not the middle
        if (id === sorted[0] || id === sorted[sorted.length - 1]) {
          this.selectedWindows = cur.filter(w => w !== id);
        }
      } else {
        // Add and auto-fill any gap to keep selection contiguous
        const merged = [...cur, id];
        const idxs = merged.map(w => order.indexOf(w)).sort((a, b) => a - b);
        const filled = [];
        for (let i = idxs[0]; i <= idxs[idxs.length - 1]; i++) filled.push(order[i]);
        this.selectedWindows = filled;
      }
    },
    prevMonth() {
      if (this.viewMonth === 0) { this.viewMonth = 11; this.viewYear--; }
      else this.viewMonth--;
    },
    nextMonth() {
      if (this.viewMonth === 11) { this.viewMonth = 0; this.viewYear++; }
      else this.viewMonth++;
    },
    selectDate(date) {
      if (!this.startDate || (this.startDate && this.endDate)) {
        // Start fresh
        this.startDate = date;
        this.endDate = null;
      } else {
        // Second click
        if (date < this.startDate) {
          this.endDate = this.startDate;
          this.startDate = date;
        } else if (date.getTime() === this.startDate.getTime()) {
          // Same day = single-day event
          this.endDate = date;
        } else {
          this.endDate = date;
        }
      }
      this.errors.dates = "";
    },
    clearDates() {
      this.startDate = null;
      this.endDate = null;
    },
    formatDate(d) {
      if (!d) return null;
      return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
    },
    toYMD(d) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },
    validate() {
      const errs = {};
      if (!this.name.trim()) errs.name = "Event name is required";
      if (!this.startDate || !this.endDate) errs.dates = "Select a start and end date";
      if (!this.selectedWindows.length) errs.dates = "Select at least one time window";
      this.errors = errs;
      return Object.keys(errs).length === 0;
    },
    async submit() {
      if (!this.validate() || this.loading) return;
      this.loading = true;
      try {
        const res = await instance.post("/add", {
          event_name: this.name.trim(),
          start_date: this.toYMD(this.startDate),
          end_date:   this.toYMD(this.endDate),
          windows:    this.selectedWindows,
        });
        this.$router.push({ name: "event", params: { id: res.data } });
      } catch (e) {
        this.errors.name = "Failed to create event. Try again.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.new-event-page {
  min-height: calc(100vh - 65px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px 60px;

  @media (min-height: 800px) { align-items: center; }
}

.form-card {
  width: 100%;
  max-width: 460px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 36px 28px 32px;
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow);
}

.form-header { margin-bottom: 28px; }
.form-title {
  font-family: var(--font-display);
  font-size: 2rem; font-weight: 700; letter-spacing: -.03em; color: var(--text); margin-bottom: 4px;
}
.form-subtitle { font-size: .88rem; color: var(--text-secondary); }

.field { margin-bottom: 22px; }
.field-label {
  display: block; font-size: .72rem; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px;
}
.field-error { font-size: .78rem; color: var(--accent); margin-top: 4px; display: block; }

.text-input {
  width: 100%; padding: 12px 14px;
  background: rgba(245,240,232,.05); border: 1px solid var(--border);
  border-radius: var(--radius-xs); color: var(--text); font-size: .95rem;
  transition: border-color .2s, background .2s;
  &::placeholder { color: var(--text-dim); }
  &:focus { outline: none; border-color: var(--accent); background: rgba(232,93,74,.05); }
  &.error { border-color: rgba(232,93,74,.6); }
}

/* ── Calendar picker ─────────────────────────────────────── */
.calendar-picker {
  background: rgba(10,10,10,.6);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  transition: border-color .2s;
  &.error { border-color: rgba(232,93,74,.5); }
}

.cal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 10px;
  border-bottom: 1px solid var(--border);
}
.cal-month { font-size: .88rem; font-weight: 600; color: var(--text); letter-spacing: .02em; }
.cal-nav {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-secondary); font-size: 1.1rem; cursor: pointer;
  transition: background .15s, border-color .15s;
  &:hover { background: rgba(245,240,232,.08); border-color: var(--border-hover); }
}

.cal-dow {
  display: grid; grid-template-columns: repeat(7, 1fr);
  padding: 8px 10px 4px;
  span { text-align: center; font-size: .65rem; color: var(--text-dim); letter-spacing: .06em; text-transform: uppercase; }
}

.cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  padding: 0 10px 10px; gap: 2px;
}

.cal-cell {
  aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; cursor: pointer;
  font-size: .82rem; color: var(--text-secondary);
  transition: background .12s, color .12s;
  min-height: 32px;

  &:hover:not(.past):not(.other-month) { background: rgba(232,93,74,.18); color: var(--text); }
  &.other-month { opacity: 0; pointer-events: none; }
  &.past { color: var(--text-dim); opacity: .35; cursor: default; }
  &.today span { text-decoration: underline; text-underline-offset: 2px; }

  &.range-start, &.range-end {
    background: var(--accent) !important;
    color: #fff !important;
    font-weight: 600;
  }
  &.in-range {
    background: rgba(232,93,74,.18);
    color: var(--text);
    border-radius: 0;
  }
  &.range-start { border-radius: 6px 0 0 6px; }
  &.range-end   { border-radius: 0 6px 6px 0; }
  &.range-start.range-end { border-radius: 6px; }
}

.cal-summary {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  background: rgba(245,240,232,.03);
}
.cal-sum-item { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.cal-sum-label { font-size: .62rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); }
.cal-sum-val { font-size: .85rem; font-weight: 500; color: var(--text); }
.cal-sum-sep { font-size: 1rem; color: var(--text-dim); }
.cal-clear {
  background: none; border: none; color: var(--text-dim); font-size: .9rem; cursor: pointer;
  padding: 4px; border-radius: 4px; transition: color .15s;
  &:hover { color: var(--accent); }
}

/* ── Time windows toggle ────────────────────────────────── */
.window-group { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

.window-btn {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 12px 8px; border-radius: var(--radius-xs);
  background: rgba(245,240,232,.04); border: 1px solid var(--border);
  cursor: pointer; transition: background .15s, border-color .15s;

  &:hover { background: rgba(245,240,232,.08); border-color: var(--border-hover); }
  &.active {
    background: var(--accent-soft);
    border-color: rgba(232,93,74,.5);
    .window-label { color: var(--accent); }
    .window-range { color: var(--text-secondary); }
  }
}
.window-label {
  font-size: .8rem; font-weight: 600; color: var(--text-secondary); letter-spacing: .02em;
}
.window-range { font-size: .68rem; color: var(--text-dim); white-space: nowrap; }
.window-summary {
  font-size: .75rem; color: var(--text-dim); text-align: center; margin-top: 6px;
}

/* ── Submit ─────────────────────────────────────────────── */
.submit-btn {
  width: 100%; margin-top: 8px; padding: 14px;
  background: var(--accent); color: #fff; font-size: .95rem; font-weight: 600;
  border: none; border-radius: var(--radius-sm); cursor: pointer;
  transition: background .2s, transform .15s, box-shadow .2s;
  box-shadow: 0 4px 20px rgba(232,93,74,.32);
  display: flex; align-items: center; justify-content: center; min-height: 50px;

  &:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
  &:disabled { opacity: .55; cursor: not-allowed; }
}
.loading-dots {
  display: flex; gap: 5px;
  i {
    display: block; width: 6px; height: 6px; border-radius: 50%; background: #fff;
    animation: dotpulse 1s ease-in-out infinite;
    &:nth-child(2) { animation-delay: .15s; }
    &:nth-child(3) { animation-delay: .3s; }
  }
}
@keyframes dotpulse { 0%,80%,100% { opacity:.3; transform:scale(.8); } 40% { opacity:1; transform:scale(1); } }
</style>
