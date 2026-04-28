<template>
  <div class="details-card">
    <h3 class="card-title">Details</h3>
    <div class="detail-row">
      <span class="detail-key">Created</span>
      <span class="detail-val">{{ $store.getters.getEventDetails.created }}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">Author</span>
      <span class="detail-val">{{ $store.getters.getEventDetails.author }}</span>
    </div>
    <div class="detail-row">
      <span class="detail-key">People</span>
      <span class="detail-val">{{ $store.getters.getEventDetails.participants }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.details-card {
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

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);

  &:last-child { border-bottom: none; }
}

.detail-key {
  font-size: 0.78rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detail-val {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
