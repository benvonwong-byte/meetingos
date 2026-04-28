<template>
  <div
    class="hour"
    :style="styleBinding(availability[hour])"
    :class="[
      idx === 0 ? 'first' : '',
      !viewMode && isSelected(hour) ? 'selected' : '',
      viewMode ? 'view-mode' : '',
    ]"
    v-for="hour in day"
    :key="hour"
    :id="hour"
    @mousedown.prevent="!viewMode && onMouseDown($event, hour)"
    @mouseover="onMouseOver($event, hour)"
    @mouseout="onMouseOut"
  ></div>
</template>

<script>
import { useStore } from "vuex";
import { computed, onMounted, onUnmounted, toRefs } from "vue";
import { useRoute } from "vue-router";
import { ActionTypes } from "../store/actions";

// ── Module-level singleton ──────────────────────────────────────────────────
const drag = { active: false, action: null, touched: new Set() };

let _mountCount      = 0;
let _attached        = false;
let _store           = null;
let _route           = null;
let _emitInspect     = null;
let _viewModeRef     = null;
let _viewTouchActive = false;
let _touchStartX     = 0;
let _touchStartY     = 0;
let _touchDir        = null; // null = undecided, 'h' = horizontal, 'v' = vertical
const DIR_THRESHOLD  = 6;    // px before direction is locked

function _isSelected(hour) {
  if (!_store) return false;
  const avail = _store.getters.getAvailability;
  return !!(avail[hour] && avail[hour].includes(_store.state.userID));
}

function _applyHour(hour, action) {
  if (!_store || !_route) return;
  if (drag.touched.has(hour)) return;
  drag.touched.add(hour);
  _store.dispatch(
    action === "ADD" ? ActionTypes.addEvent : ActionTypes.removeEvent,
    { unixtime: hour, eventID: _route.params.id }
  );
}

function _commitDrag() {
  _viewTouchActive = false;
  _touchDir        = null;
  if (drag.touched.size > 0 && _store) {
    _store.dispatch(ActionTypes.updateDatabase);
  }
  drag.active = false;
  drag.action = null;
  drag.touched.clear();
}

function _onTouchStart(event) {
  const touch = event.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!el || !el.classList.contains("hour")) return;
  event.preventDefault();

  _touchStartX = touch.clientX;
  _touchStartY = touch.clientY;
  _touchDir    = null;

  if (_viewModeRef && _viewModeRef.value) {
    _viewTouchActive = true;
    _emitInspect && _emitInspect({ hour: el.id });
    return;
  }

  drag.active = true;
  drag.action = _isSelected(el.id) ? "REMOVE" : "ADD";
  drag.touched.clear();
  _applyHour(el.id, drag.action);
}

function _onTouchMove(event) {
  const touch = event.touches[0];

  // Lock direction on first significant movement
  if (_touchDir === null) {
    const dx = Math.abs(touch.clientX - _touchStartX);
    const dy = Math.abs(touch.clientY - _touchStartY);
    if (Math.max(dx, dy) > DIR_THRESHOLD) {
      _touchDir = dx >= dy ? 'h' : 'v';
    }
  }

  // Vertical scroll — let the browser handle it, don't interfere
  if (_touchDir === 'v') return;

  event.preventDefault();

  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!el || !el.classList.contains("hour")) return;

  if (_viewModeRef && _viewModeRef.value) {
    if (_viewTouchActive) {
      _emitInspect && _emitInspect({ hour: el.id });
    }
    return;
  }

  if (!drag.active) return;
  _applyHour(el.id, drag.action);
}

function _attachListeners() {
  if (_attached) return;
  _attached = true;
  document.addEventListener("touchstart", _onTouchStart, { passive: false });
  document.addEventListener("touchmove",  _onTouchMove,  { passive: false });
  document.addEventListener("touchend",   _commitDrag);
  document.addEventListener("mouseup",    _commitDrag);
}

function _detachListeners() {
  if (!_attached) return;
  _attached = false;
  document.removeEventListener("touchstart", _onTouchStart);
  document.removeEventListener("touchmove",  _onTouchMove);
  document.removeEventListener("touchend",   _commitDrag);
  document.removeEventListener("mouseup",    _commitDrag);
}

// ── Component ───────────────────────────────────────────────────────────────
export default {
  props: {
    day:      { type: Array,   required: true },
    idx:      { type: Number,  required: true },
    viewMode: { type: Boolean, default: false },
  },
  emits: ["inspect"],
  setup(props, { emit }) {
    const store = useStore();
    const route = useRoute();
    const { viewMode } = toRefs(props);

    onMounted(() => {
      _store       = store;
      _route       = route;
      _viewModeRef = viewMode;
      _emitInspect = (payload) => emit("inspect", payload);
      _mountCount++;
      if (_mountCount === 1) _attachListeners();
    });

    onUnmounted(() => {
      _mountCount--;
      if (_mountCount === 0) {
        _detachListeners();
        _store = _route = _viewModeRef = _emitInspect = null;
      }
    });

    // ── Mouse (desktop) ─────────────────────────────────────────────────────
    const onMouseDown = (event, hour) => {
      drag.active = true;
      drag.action = _isSelected(hour) ? "REMOVE" : "ADD";
      drag.touched.clear();
      _applyHour(hour, drag.action);
    };

    const onMouseOver = (event, hour) => {
      store.dispatch(ActionTypes.updateHover, String(hour));
      if (viewMode.value) {
        emit("inspect", { hour });
        return;
      }
      if (!event.buttons) return;
      if (drag.active && event.buttons === 1) {
        _applyHour(hour, drag.action);
      }
    };

    const onMouseOut = () => store.dispatch(ActionTypes.updateHover, "MouseOut");

    // ── Color gradient ──────────────────────────────────────────────────────
    const totalParticipants = computed(() =>
      Math.max(store.state.eventData?.users?.length || 1, 1)
    );

    const styleBinding = (arr) => {
      if (!arr || arr.length === 0) return {};
      const ratio = Math.min(arr.length / totalParticipants.value, 1);
      // Power curve: 1 person out of many stays very faint; only near-full attendance looks rich
      const curved     = Math.pow(ratio, 1.5);
      const hue        = 145;
      const saturation = Math.round(15 + curved * 70);   // 15% → 85%
      const lightness  = Math.round(68 - curved * 38);   // 68% → 30%
      const opacity    = 0.12 + curved * 0.83;           // 0.12 → 0.95
      return {
        "background-color": `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`,
      };
    };

    const isSelected = (hour) => {
      const avail = store.getters.getAvailability;
      return !!(avail[hour] && avail[hour].includes(store.state.userID));
    };

    return {
      isSelected, onMouseDown, onMouseOver, onMouseOut, styleBinding,
      availability: computed(() => store.getters.getAvailability),
    };
  },
};
</script>

<style lang="scss" scoped>
.hour {
  width: 100%;
  height: 36px;
  border-bottom: 1px solid rgba(245, 240, 232, 0.06);
  border-right:  1px solid rgba(245, 240, 232, 0.06);
  background-color: rgba(245, 240, 232, 0.03);
  cursor: pointer;
  transition: background-color 0.1s ease;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;

  &.selected { box-shadow: inset 0 0 0 1.5px rgba(100, 200, 140, 0.45); }
  @media (hover: hover) {
    &:hover:not(.view-mode) { background-color: rgba(232, 93, 74, 0.14) !important; }
    &.view-mode:hover       { background-color: rgba(245, 240, 232, 0.1) !important; }
  }
  &.view-mode { cursor: default; }

}

.first            { border-left:  1px solid rgba(245, 240, 232, 0.06); }
.hour:first-child { border-top: 1px solid rgba(245, 240, 232, 0.06); }
</style>
