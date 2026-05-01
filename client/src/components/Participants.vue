<template>
  <div class="participants-card">
    <h3 class="card-title">Participants</h3>
    <div v-if="participants.length === 0" class="empty-state">
      No participants yet.
    </div>
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
  </div>
</template>

<script>
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
</script>

<style lang="scss" scoped>
.participants-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 18px 16px;
}

.card-title {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 14px;
}

.empty-state {
  font-size: 0.85rem;
  color: var(--text-dim);
}

.participant {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  transition: opacity 0.15s ease;
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
}

.participant-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(100, 200, 140, 0.85);
  flex-shrink: 0;
}

.participant-name {
  font-size: 0.88rem;
  color: var(--text-secondary);
}
</style>
