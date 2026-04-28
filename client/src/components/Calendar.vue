<template>
  <div class="calendar-outer">
    <div class="timelabels">
      <span v-for="tlabel in timeLabels" :key="tlabel">{{ tlabel }}</span>
    </div>
    <div class="calendar">
      <div class="day" v-for="(day, idx) in result" :key="day">
        <div class="daylabel">
          <span class="day-num">{{ getDate(day[0]) }}</span>
          <p class="day-name">{{ getDay(day[0]) }}</p>
        </div>
        <HourBox :day="day" :idx="idx" :view-mode="viewMode" @inspect="$emit('inspect', $event)" />
      </div>
    </div>
  </div>
</template>

<script>
import { ActionTypes } from "@/store/actions";
import { getDate, getDay } from "../utils";
import HourBox from "./HourBox.vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { computed, toRefs } from "vue";

export default {
  components: { HourBox },
  props: {
    page:     { type: Number,  required: true },
    viewMode: { type: Boolean, default: false },
  },
  emits: ["inspect"],
  setup(props) {
    const route = useRoute();
    const store = useStore();
    const { page } = toRefs(props);

    store.dispatch(ActionTypes.loadAvailabilities, route.params.id);

    return {
      result: computed(() => store.getters.getSplitAvailabilities[page.value]),
      getDate,
      getDay,
      timeLabels: computed(() => store.getters.getTimeLabels),
    };
  },
};
</script>

<style lang="scss" scoped>
.calendar-outer {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}

.timelabels {
  padding-top: 72px;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  align-self: stretch;

  span {
    font-size: 0.72rem;
    color: var(--text-dim);
    text-align: right;
    white-space: nowrap;
    line-height: 1;
  }
}

.calendar {
  display: flex;
  flex-direction: row;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border);
  flex: 1;
}

.day {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.daylabel {
  text-align: center;
  padding: 12px 4px 10px;
  border-bottom: 1px solid var(--border);
  background: rgba(245, 240, 232, 0.03);
}

.day-num {
  display: block;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.2;
}

.day-name {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  margin-top: 2px;
}
</style>
