<template>
  <transition name="backdrop-fade" appear>
    <div class="backdrop">
      <transition name="modal-slide" appear>
        <div class="modal" v-if="show">
          <img src="/pigeon-logo.svg" alt="Dear Crisis" class="modal-pigeon" />
          <h2 class="modal-title">Mark your availability</h2>
          <p class="modal-desc">Confirm your name to add your schedule to this event.</p>
          <form @submit.prevent="handleSubmit" class="modal-form">
            <input
              type="text"
              v-model="name"
              placeholder="Your name…"
              class="modal-input"
              autocomplete="off"
              autofocus
            />
            <button type="submit" class="modal-btn" :disabled="!name.trim()">
              Add my availability →
            </button>
          </form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { ref } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { ActionTypes } from "../store/actions";

export default {
  setup() {
    const store = useStore();
    const route = useRoute();
    const name = ref(localStorage.getItem("dc_user_name") || "");
    const show = ref(false);

    setTimeout(() => { show.value = true; }, 60);

    const handleSubmit = () => {
      if (!name.value.trim()) return;
      store.dispatch(ActionTypes.addUserName, {
        username: name.value.trim(),
        eventID: route.params.id,
      });
    };

    return { name, handleSubmit, show };
  },
};
</script>

<style lang="scss" scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius);
  padding: 36px 32px;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border-hover);
}

.modal-pigeon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 14px;
  filter: drop-shadow(0 3px 10px rgba(232, 93, 74, 0.25));
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--text);
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 28px;
  line-height: 1.5;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(245, 240, 232, 0.06);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-xs);
  color: var(--text);
  font-size: 0.95rem;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;

  &::placeholder { color: var(--text-dim); }

  &:focus {
    outline: none;
    border-color: var(--accent);
    background: rgba(232, 93, 74, 0.06);
  }
}

.modal-btn {
  width: 100%;
  padding: 13px;
  background: var(--accent);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, opacity 0.2s;
  box-shadow: 0 4px 20px rgba(232, 93, 74, 0.3);

  &:hover:not(:disabled) {
    background: var(--accent-hover);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
  transform: translateY(-16px) scale(0.97);
}
</style>
