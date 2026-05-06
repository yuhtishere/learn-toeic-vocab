<template>
  <!-- ============================================================
    FlashCard — Thẻ học với hiệu ứng lật 3D
    
    Cơ chế flip:
    1. Container có perspective để tạo chiều sâu 3D
    2. Card inner wrap cả 2 mặt, xoay khi isFlipped = true
    3. Mặt sau có rotateY(180deg) để "ẩn" khi chưa lật
    4. backface-visibility: hidden ngăn nhìn xuyên qua
  ============================================================ -->
  <div
    class="flashcard-wrapper"
    @click="handleFlip"
    :id="`flashcard-${word.id}`"
    role="button"
    :aria-label="isFlipped ? 'Click để lật về mặt trước' : 'Click để xem nghĩa'"
    tabindex="0"
    @keydown.space.prevent="handleFlip"
    @keydown.enter="handleFlip"
  >
    <!-- Container tạo perspective 3D -->
    <div class="flashcard" :class="{ 'flashcard--flipped': isFlipped }">

      <!-- === MẶT TRƯỚC: Từ tiếng Anh === -->
      <div class="flashcard__face flashcard__face--front">
        <!-- Decorative background elements -->
        <div class="flashcard__bg">
          <div class="flashcard__bg-circle flashcard__bg-circle--1"></div>
          <div class="flashcard__bg-circle flashcard__bg-circle--2"></div>
        </div>

        <!-- Day label -->
        <div class="flashcard__day-label">
          {{ formatDayLabel(word.dayKey) }}
        </div>

        <!-- Từ chính -->
        <div class="flashcard__word-container">
          <h2 class="flashcard__word">{{ word.word }}</h2>
          <!-- Nút phát âm -->
          <button 
            class="flashcard__speak-btn" 
            @click.stop="speakWord"
            title="Nghe phát âm"
            aria-label="Nghe phát âm"
          >
            <el-icon><Microphone /></el-icon>
          </button>
        </div>

        <!-- Hint -->
        <div class="flashcard__hint">
          <el-icon><ArrowDown /></el-icon>
          <span>Click để xem nghĩa</span>
        </div>

        <!-- Bookmark button -->
        <div class="flashcard__bookmark" @click.stop>
          <BookmarkButton :word-id="word.id" :day-key="word.dayKey" size="lg" />
        </div>
      </div>

      <!-- === MẶT SAU: Nghĩa + Chi tiết === -->
      <div class="flashcard__face flashcard__face--back">
        <div class="flashcard__bg">
          <div class="flashcard__bg-circle flashcard__bg-circle--back-1"></div>
        </div>

        <!-- Từ nhỏ ở trên -->
        <div class="flashcard__back-word">
          <span>{{ word.word }}</span>
          <span v-if="word.type" class="badge badge--muted">{{ word.type }}</span>
        </div>

        <!-- Nghĩa tiếng Việt — nổi bật nhất -->
        <div class="flashcard__meaning-container">
          <p class="flashcard__meaning">{{ word.meaning }}</p>
        </div>

        <!-- Câu ví dụ -->
        <div v-if="word.example" class="flashcard__example">
          <div class="flashcard__example-label">
            <el-icon><ChatLineSquare /></el-icon>
            <span>Ví dụ</span>
          </div>
          <p class="flashcard__example-text">{{ word.example }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BookmarkButton from '@/components/common/BookmarkButton.vue'

const props = defineProps({
  word: {
    type: Object,
    required: true,
    // { id, word, type, meaning, example, dayKey }
  },
})

// Emit events lên FlashCardView
const emit = defineEmits(['flip'])

// Trạng thái lật thẻ
const isFlipped = ref(false)

// Reset khi từ thay đổi (chuyển thẻ mới)
watch(() => props.word.id, () => {
  isFlipped.value = false
})

// Xử lý lật thẻ
function handleFlip() {
  isFlipped.value = !isFlipped.value
  emit('flip', isFlipped.value)
}

// Format "day 1" → "Ngày 1"
function formatDayLabel(dayKey) {
  if (!dayKey) return ''
  return dayKey.replace('day ', 'Ngày ')
}

// Xử lý phát âm bằng Web Speech API
function speakWord() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(props.word.word)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }
}

// Expose để FlashCardView có thể gọi từ bên ngoài (Space key handler)
defineExpose({ flip: handleFlip, isFlipped })
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

// ============================================================
// Wrapper — tạo không gian perspective 3D
// ============================================================
.flashcard-wrapper {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  // perspective tạo hiệu ứng 3D depth
  perspective: 1200px;
  cursor: pointer;
  outline: none;
  // Animation khi mount (key thay đổi → remount → chạy animation)
  animation: cardFadeIn 0.25s ease both;

  // Focus ring (accessibility)
  &:focus-visible {
    .flashcard {
      box-shadow: 0 0 0 3px rgba($color-primary, 0.5), $shadow-lg;
    }
  }
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}

// ============================================================
// Flashcard — container lật
// transform-style: preserve-3d cho phép children xoay trong 3D
// ============================================================
.flashcard {
  position: relative;
  width: 100%;
  // Tỷ lệ thẻ 3:2 → aspect-ratio để responsive
  min-height: 340px;
  transform-style: preserve-3d;
  // Animation lật: cubic-bezier tạo feel "vật lý" tự nhiên
  transition: $transition-flip;
  border-radius: $radius-2xl;

  // Khi lật: xoay 180 độ theo trục Y
  &--flipped {
    transform: rotateY(180deg);
  }
}

// ============================================================
// Face — chung cho cả mặt trước và sau
// backface-visibility: hidden ẩn mặt đang "quay vào trong"
// ============================================================
.flashcard__face {
  position: absolute;
  inset: 0;
  border-radius: $radius-2xl;
  padding: $space-8 $space-6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // Quan trọng: ẩn mặt khi đang quay vào trong
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;

  // Mặt trước — gradient xanh
  &--front {
    background: linear-gradient(145deg, #1a2744 0%, #0d1b3e 50%, #162238 100%);
    border: 1px solid rgba($color-primary, 0.3);
    box-shadow: $shadow-lg, 0 0 40px rgba($color-primary, 0.1);
    transform: rotateY(0deg) translateZ(1px);
    z-index: 2;
  }

  // Mặt sau — gradient tím/xanh lá
  // rotateY(180deg) để khi container xoay, mặt này "thẳng"
  &--back {
    background: linear-gradient(145deg, #1a2d1a 0%, #0d2010 50%, #162b16 100%);
    border: 1px solid rgba($color-success, 0.3);
    box-shadow: $shadow-lg, 0 0 40px rgba($color-success, 0.08);
    transform: rotateY(180deg) translateZ(1px);
    z-index: 1;
  }
}

.flashcard__bg {
  position: absolute;
  inset: 0;
  border-radius: $radius-2xl;
  overflow: hidden;
  z-index: 0;
}

// ============================================================
// Decorative background circles
// ============================================================
.flashcard__bg-circle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;

  &--1 {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba($color-primary, 0.12) 0%, transparent 70%);
    top: -60px;
    right: -60px;
  }

  &--2 {
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(#7c3aed, 0.1) 0%, transparent 70%);
    bottom: -40px;
    left: -40px;
  }

  &--back-1 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba($color-success, 0.08) 0%, transparent 70%);
    top: -80px;
    left: -60px;
  }
}

// ============================================================
// Front face content
// ============================================================
.flashcard__day-label {
  position: absolute;
  top: $space-4;
  left: $space-5;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  color: rgba($color-text-secondary, 0.7);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.flashcard__word-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  text-align: center;
  z-index: 1;
}

.flashcard__word {
  font-size: clamp($font-size-3xl, 6vw, $font-size-4xl);
  font-weight: $font-weight-extrabold;
  color: $color-text-primary;
  letter-spacing: -0.02em;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  word-break: break-word;
  text-align: center;
}

.flashcard__type {
  font-size: $font-size-sm;
}

.flashcard__speak-btn {
  background: rgba($color-primary, 0.1);
  border: 1px solid rgba($color-primary, 0.3);
  color: $color-primary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: $transition-fast;
  font-size: 1.2rem;
  margin-top: -4px;
  margin-bottom: $space-2;

  &:hover {
    background: rgba($color-primary, 0.2);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }

  &--small {
    padding: 4px;
    font-size: 1rem;
    margin: 0;
    background: none;
    border: none;

    &:hover {
      background: rgba($color-primary, 0.15);
    }
  }
}

.flashcard__hint {
  position: absolute;
  bottom: $space-5;
  display: flex;
  align-items: center;
  gap: $space-2;
  color: rgba($color-text-secondary, 0.5);
  font-size: $font-size-xs;
  animation: bounce 2s ease infinite;

  .el-icon { font-size: 0.8rem; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(4px); }
}

// ============================================================
// Back face content
// ============================================================
.flashcard__back-word {
  position: absolute;
  top: $space-4;
  left: $space-5;
  right: $space-5;
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
}

.flashcard__meaning-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 1;
  padding: 0 $space-4;
}

.flashcard__meaning {
  font-size: clamp($font-size-xl, 4vw, $font-size-3xl);
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  margin: 0;
  line-height: 1.4;
}

.flashcard__example {
  position: absolute;
  bottom: $space-10;
  left: $space-5;
  right: $space-5;
  z-index: 1;
}

.flashcard__example-label {
  display: flex;
  align-items: center;
  gap: $space-1;
  color: $color-success;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  margin-bottom: $space-2;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.flashcard__example-text {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  font-style: italic;
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// Bookmark button — góc phải trên
.flashcard__bookmark {
  position: absolute;
  top: $space-4;
  right: $space-4;
  z-index: 2;
}
</style>
