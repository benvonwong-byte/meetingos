# Clickable Participants Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make participant names in the sidebar clickable to highlight that person's time slots with a gold outline, with auto-page-jump if the current date range has none of their slots.

**Architecture:** Add `selectedParticipantId` to Vuex store; Participants.vue toggles it on click; HourBox.vue reads it to layer a gold box-shadow over matching slots; Event.vue watches it and jumps `page` to the first page containing that participant's slots if the current page has none.

**Tech Stack:** Vue 3 Composition API, Vuex 4, TypeScript, SCSS

---

### Task 1: Add selectedParticipantId to Vuex state

**Files:**
- Modify: `client/src/store/state.ts`

**Step 1: Add field to State interface and initial state**

In `state.ts`, add `selectedParticipantId` to both the interface and the initial `state` object:

```ts
export interface State {
  eventData: EventData;
  userID: string;
  currentHover: string[];
  selectedParticipantId: string | null;  // ← add this
}

export const state: State = {
  eventData: <EventData>{},
  userID: "",
  currentHover: [],
  selectedParticipantId: null,           // ← add this
};
```

**Step 2: Commit**

```bash
git add client/src/store/state.ts
git commit -m "feat: add selectedParticipantId to Vuex state"
```

---

### Task 2: Add mutation and action

**Files:**
- Modify: `client/src/store/mutations.ts`
- Modify: `client/src/store/actions.ts`

**Step 1: Add mutation type and implementation to mutations.ts**

Add to the `MutationType` enum:
```ts
setSelectedParticipant = "SET_SELECTED_PARTICIPANT",
```

Add to the `Mutations` type:
```ts
[MutationType.setSelectedParticipant](state: State, id: string | null): void;
```

Add to the `mutations` object:
```ts
[MutationType.setSelectedParticipant](state, id) {
  state.selectedParticipantId = id;
},
```

**Step 2: Add action to actions.ts**

Add to the `ActionTypes` enum:
```ts
setSelectedParticipant = "SET_SELECTED_PARTICIPANT",
```

Add to the `Actions` type:
```ts
[ActionTypes.setSelectedParticipant](context: ActionAugments, id: string | null): void;
```

Add to the `actions` object:
```ts
[ActionTypes.setSelectedParticipant]({ commit }, id) {
  commit(MutationType.setSelectedParticipant, id);
},
```

**Step 3: Commit**

```bash
git add client/src/store/mutations.ts client/src/store/actions.ts
git commit -m "feat: add setSelectedParticipant mutation and action"
```

---

### Task 3: Make participant names clickable

**Files:**
- Modify: `client/src/components/Participants.vue`

**Step 1: Add click handler and selected state to template**

Replace the current `<div class="participant" ...>` block with:

```html
<div
  class="participant"
  v-for="participant in participants"
  :style="styleBindingParticipant(participant)"
  :class="{ selected: selectedParticipantId === participant.id }"
  :key="participant.id"
  @click="toggleParticipant(participant.id)"
>
  <span class="participant-dot"></span>
  <p class="participant-name">{{ participant.name }}</p>
</div>
```

**Step 2: Add computed + method to script**

Replace the entire `<script>` block:

```js
export default {
  computed: {
    participants() {
      return this.$store.getters.getParticipantList;
    },
    selectedParticipantId() {
      return this.$store.state.selectedParticipantId;
    },
  },
  methods: {
    styleBindingParticipant(participant) {
      const hover = this.$store.state.currentHover;
      if (hover.length > 0 && !hover.includes(participant.id)) {
        return { opacity: "0.3" };
      }
      return {};
    },
    toggleParticipant(id) {
      const current = this.$store.state.selectedParticipantId;
      this.$store.dispatch("SET_SELECTED_PARTICIPANT", current === id ? null : id);
    },
  },
};
```

**Step 3: Add active styles to the SCSS block**

Add inside `.participant`:
```scss
cursor: pointer;

&.selected .participant-name {
  color: var(--text);
  border-bottom: 1px solid hsla(45, 90%, 60%, 0.6);
}

&.selected .participant-dot {
  box-shadow: 0 0 0 2px hsla(45, 90%, 60%, 0.5);
}

@media (hover: hover) {
  &:hover .participant-name {
    color: var(--text);
  }
}
```

**Step 4: Verify visually** — open the app, click a participant name, confirm active state appears.

**Step 5: Commit**

```bash
git add client/src/components/Participants.vue
git commit -m "feat: clickable participant names with toggle selection"
```

---

### Task 4: Highlight selected participant's slots in HourBox

**Files:**
- Modify: `client/src/components/HourBox.vue`

**Step 1: Read selectedParticipantId in styleBinding**

In the `setup()` function, add a computed for `selectedParticipantId` and update `styleBinding`:

After the `totalParticipants` computed, add:
```js
const selectedParticipantId = computed(() => store.state.selectedParticipantId);
```

Replace the existing `styleBinding` function:
```js
const styleBinding = (arr) => {
  const style = {};

  if (arr && arr.length > 0) {
    const ratio = Math.min(arr.length / totalParticipants.value, 1);
    const curved     = Math.pow(ratio, 1.5);
    const hue        = 145;
    const saturation = Math.round(15 + curved * 70);
    const lightness  = Math.round(68 - curved * 38);
    const opacity    = 0.12 + curved * 0.83;
    style["background-color"] = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
  }

  const selId = selectedParticipantId.value;
  if (selId && arr && arr.includes(selId)) {
    style["box-shadow"] = "inset 0 0 0 2px hsla(45, 90%, 60%, 0.8)";
  }

  return style;
};
```

Add `selectedParticipantId` to the return object of `setup()`.

**Step 2: Verify visually** — select a participant, confirm gold outline appears only on their slots.

**Step 3: Commit**

```bash
git add client/src/components/HourBox.vue
git commit -m "feat: gold outline on selected participant's slots"
```

---

### Task 5: Auto-jump page when current page has no slots for selected participant

**Files:**
- Modify: `client/src/views/Event.vue`

**Step 1: Add watcher in setup()**

Import `watch` is already imported. Add this watcher after the existing `watch(viewMode, ...)` block:

```js
watch(
  () => store.state.selectedParticipantId,
  (id) => {
    if (!id) return;

    const pages = store.getters.getSplitAvailabilities;
    const avail = store.getters.getAvailability;

    // Check if current page has any slots for this participant
    const currentPageSlots = pages[page.value]?.flat() ?? [];
    const hasOnCurrentPage = currentPageSlots.some(
      (slot) => avail[slot]?.includes(id)
    );

    if (hasOnCurrentPage) return;

    // Find first page that has slots for this participant
    for (let p = 0; p < pages.length; p++) {
      const slots = pages[p].flat();
      if (slots.some((slot) => avail[slot]?.includes(id))) {
        page.value = p;
        return;
      }
    }
    // Participant has no slots anywhere — don't jump
  }
);
```

**Step 2: Verify end-to-end**

1. Navigate to an event with multiple pages and multiple participants
2. Navigate to a page where participant A has no slots
3. Click participant A's name — confirm page jumps to their first active page
4. Click same name again — confirm deselection (no jump)
5. Click participant B's name while on a page where B has slots — confirm no jump

**Step 3: Commit**

```bash
git add client/src/views/Event.vue
git commit -m "feat: auto-jump to participant's first active page when selected"
```

---

### Done

All 5 tasks complete. The feature is fully implemented:
- Clicking a name highlights that participant's slots with a gold outline
- Clicking the same name again deselects
- If the current page is empty for that participant, the view jumps to their first active page
- Works in both Edit and View modes
