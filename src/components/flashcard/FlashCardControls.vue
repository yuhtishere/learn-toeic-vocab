<template>
  <!-- ============================================================
    FlashCardControls — Nút "Chưa thuộc" / "Đã thuộc" dưới flashcard
  ============================================================ -->
  <div class="fc-controls" id="flashcard-controls">

    <!-- Nút Chưa thuộc (←) -->
    <button
      class="fc-controls__btn fc-controls__btn--unknown"
      @click="$emit('unknown')"
      id="btn-unknown"
      :disabled="!canAnswer"
      aria-label="Chưa thuộc - phím mũi tên trái"
    >
      <el-icon class="fc-controls__btn-icon"><ArrowLeft /></el-icon>
      <span class="fc-controls__btn-label">Chưa thuộc</span>
      <span class="fc-controls__btn-key">←</span>
    </button>

    <!-- Số thứ tự thẻ / tổng -->
    <div class="fc-controls__counter">
      <span class="fc-controls__current">{{ current }}</span>
      <span class="fc-controls__separator">/</span>
      <span class="fc-controls__total">{{ total }}</span>
    </div>

    <!-- Nút Đã thuộc (→) -->
    <button
      class="fc-controls__btn fc-controls__btn--known"
      @click="$emit('known')"
      id="btn-known"
      :disabled="!canAnswer"
      aria-label="Đã thuộc - phím mũi tên phải"
    >
      <span class="fc-controls__btn-label">Đã thuộc</span>
      <el-icon class="fc-controls__btn-icon"><ArrowRight /></el-icon>
      <span class="fc-controls__btn-key">→</span>
    </button>

  </div>
</template>

<script setup>
defineProps({
  current: { type: Number, required: true },
  total:   { type: Number, required: true },
  /** Chỉ cho phép trả lời sau khi đã lật thẻ */
  canAnswer: { type: Boolean, default: true },
})

defineEmits(['known', 'unknown'])
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.fc-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-4;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;

  &__btn {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-3 $space-5;
    border-radius: $radius-xl;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border: 2px solid transparent;
    cursor: pointer;
    transition: $transition-base;
    flex: 1;
    max-width: 200px;
    justify-content: center;
    white-space: nowrap;
    position: relative;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
    }

    // Nút "Chưa thuộc" — đỏ/coral
    &--unknown {
      background: rgba($color-danger, 0.12);
      border-color: rgba($color-danger, 0.4);
      color: $color-danger;

      &:not(:disabled):hover {
        background: rgba($color-danger, 0.2);
        border-color: $color-danger;
        transform: translateX(-3px);
        box-shadow: $shadow-md;
      }

      &:not(:disabled):active {
        transform: scale(0.97);
      }
    }

    // Nút "Đã thuộc" — xanh lá
    &--known {
      background: rgba($color-success, 0.12);
      border-color: rgba($color-success, 0.4);
      color: $color-success;

      &:not(:disabled):hover {
        background: rgba($color-success, 0.2);
        border-color: $color-success;
        transform: translateX(3px);
        box-shadow: $shadow-md;
      }

      &:not(:disabled):active {
        transform: scale(0.97);
      }
    }

    &-icon {
      font-size: 1rem;
    }

    &-key {
      font-size: $font-size-xs;
      opacity: 0.6;
      font-family: monospace;
    }
  }

  // Bộ đếm ở giữa
  &__counter {
    display: flex;
    align-items: baseline;
    gap: $space-1;
    min-width: 60px;
    justify-content: center;
  }

  &__current {
    font-size: $font-size-2xl;
    font-weight: $font-weight-extrabold;
    color: $color-text-primary;
    line-height: 1;
  }

  &__separator {
    font-size: $font-size-lg;
    color: $color-text-muted;
  }

  &__total {
    font-size: $font-size-base;
    color: $color-text-muted;
  }
}
</style>
