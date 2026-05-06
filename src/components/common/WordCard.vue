<template>
  <!-- ============================================================
    WordCard — Hiển thị một từ vựng trong danh sách
    Example luôn hiển thị, có nút bookmark
  ============================================================ -->
  <div
    class="word-card"
    :class="{ 'word-card--known': isKnown }"
    :id="`word-card-${word.id}-${word.dayKey}`"
  >
    <!-- Header: từ + từ loại + bookmark -->
    <div class="word-card__header">
      <div class="word-card__info">
        <!-- Số thứ tự -->
        <span class="word-card__index">{{ index }}</span>

        <div class="word-card__main">
          <!-- Từ tiếng Anh -->
          <h3 class="word-card__word">{{ word.word }}</h3>

          <!-- Nút phát âm -->
          <button 
            class="word-card__speak-btn" 
            @click.stop="speakWord"
            title="Nghe phát âm"
            aria-label="Nghe phát âm"
          >
            <el-icon><Microphone /></el-icon>
          </button>

          <!-- Từ loại -->
          <span v-if="word.type" class="badge badge--muted word-card__type">
            {{ word.type }}
          </span>
        </div>

        <!-- Tag "Đã thuộc" -->
        <span v-if="isKnown" class="badge badge--green word-card__known-tag">
          <el-icon><Check /></el-icon>
          Thuộc
        </span>
      </div>

      <div class="word-card__actions" @click.stop>
        <!-- Nút bookmark -->
        <BookmarkButton :word-id="word.id" :day-key="word.dayKey" />
      </div>
    </div>

    <!-- Nghĩa -->
    <p class="word-card__meaning">{{ word.meaning }}</p>

    <!-- Câu ví dụ — luôn hiển thị -->
    <div v-if="word.example" class="word-card__detail">
      <div class="word-card__example">
        <el-icon class="word-card__example-icon"><ChatLineSquare /></el-icon>
        <p>{{ word.example }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useVocabularyStore } from '@/store/vocabulary'
import BookmarkButton from './BookmarkButton.vue'

const props = defineProps({
  word: {
    type: Object,
    required: true,
    // { id, word, type, meaning, example, dayKey }
  },
  index: {
    type: Number,
    default: null,
  }
})

const store = useVocabularyStore()

// Trạng thái đã thuộc
const isKnown = computed(() =>
  store.getWordStatus(props.word.dayKey, props.word.id) === 'known'
)

// Chức năng phát âm bằng Web Speech API
function speakWord() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(props.word.word)
    utterance.lang = 'en-US' 
    utterance.rate = 0.9     
    
    window.speechSynthesis.speak(utterance)
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.word-card {
  background: $color-card;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: $space-4;
  transition: $transition-base;
  animation: fadeIn 0.3s ease both;

  &:hover {
    border-color: rgba($color-primary, 0.4);
    background: $color-card-hover;
    transform: translateY(-1px);
    box-shadow: $shadow-md;
  }

  &--known {
    border-color: rgba($color-success, 0.3);
    background: rgba($color-success, 0.04);
  }

  // --- Header ---
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $space-3;
    margin-bottom: $space-2;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $space-3;
    flex: 1;
    min-width: 0;
  }

  &__index {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: $font-weight-medium;
    min-width: 20px;
    text-align: center;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
  }

  &__word {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    margin: 0;
    word-break: break-word;
  }

  &__speak-btn {
    background: none;
    border: none;
    color: $color-primary;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: 50%;
    transition: $transition-fast;
    font-size: 1.1rem;

    &:hover {
      background: rgba($color-primary, 0.15);
      transform: scale(1.1);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }

  &__type {
    font-size: $font-size-xs;
    white-space: nowrap;
  }

  &__known-tag {
    display: flex;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
    font-size: $font-size-xs;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: $space-2;
    flex-shrink: 0;
  }

  // --- Meaning ---
  &__meaning {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin: 0;
    padding-left: calc(20px + #{$space-3}); // align với word
    line-height: 1.5;
  }

  // --- Detail (ví dụ) ---
  &__detail {
    margin-top: $space-3;
    padding-top: $space-3;
    border-top: 1px solid $color-border;
  }

  &__example {
    display: flex;
    gap: $space-2;
    align-items: flex-start;
    padding: $space-3;
    background: rgba($color-primary, 0.06);
    border-radius: $radius-md;
    border-left: 3px solid $color-primary;

    p {
      font-size: $font-size-sm;
      color: $color-text-secondary;
      font-style: italic;
      margin: 0;
      line-height: 1.6;
    }
  }

  &__example-icon {
    color: $color-primary;
    font-size: 0.9rem;
    margin-top: 2px;
    flex-shrink: 0;
  }
}
</style>
