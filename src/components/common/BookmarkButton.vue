<template>
  <!-- ============================================================
    BookmarkButton — Nút trái tim để lưu/bỏ lưu từ vào My List
  ============================================================ -->
  <button
    class="bookmark-btn"
    :class="{ 'bookmark-btn--active': isActive }"
    @click.stop="handleToggle"
    :aria-label="isActive ? 'Bỏ lưu từ này' : 'Lưu từ này'"
    :id="`bookmark-${wordId}-${dayKey}`"
    type="button"
  >
    <!-- Icon đầy (đã bookmark) -->
    <el-icon v-if="isActive" class="bookmark-btn__icon bookmark-btn__icon--filled">
      <Star />
    </el-icon>
    <!-- Icon viền (chưa bookmark) -->
    <el-icon v-else class="bookmark-btn__icon">
      <StarFilled />
    </el-icon>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useVocabularyStore } from '@/store/vocabulary'

const props = defineProps({
  wordId: {
    type: Number,
    required: true,
  },
  dayKey: {
    type: String,
    required: true,
  },
  /** Size variant: 'sm' | 'md' | 'lg' */
  size: {
    type: String,
    default: 'md',
  }
})

const store = useVocabularyStore()

// Kiểm tra trạng thái bookmark
const isActive = computed(() => store.isBookmarkedWord(props.wordId, props.dayKey))

// Toggle bookmark khi click
function handleToggle() {
  store.toggleBookmark(props.wordId, props.dayKey)
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.bookmark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  cursor: pointer;
  color: $color-text-muted;
  transition: $transition-fast;
  flex-shrink: 0;

  &:hover {
    border-color: $color-gold;
    color: $color-gold;
    background: rgba($color-gold, 0.08);
    transform: scale(1.05);
  }

  // Trạng thái đã bookmark
  &--active {
    border-color: $color-gold;
    color: $color-gold;
    background: rgba($color-gold, 0.12);

    &:hover {
      background: rgba($color-gold, 0.2);
    }

    .bookmark-btn__icon {
      animation: pulse 0.3s ease;
    }
  }

  &__icon {
    font-size: 1rem;
  }
}

@keyframes pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
</style>
