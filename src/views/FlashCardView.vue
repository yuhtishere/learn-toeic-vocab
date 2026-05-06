<template>
  <!-- ============================================================
    FlashCardView — Chế độ học Flashcard
    Hỗ trợ keyboard: Space (lật), ← (chưa thuộc), → (đã thuộc)
  ============================================================ -->
  <div class="fc-view">

    <!-- === COMPLETION SCREEN === -->
    <transition name="fade">
      <div v-if="isCompleted" class="fc-complete">
        <div class="fc-complete__card container">
          <div class="fc-complete__emoji">🎉</div>
          <h2 class="fc-complete__title">Xong rồi!</h2>
          <p class="fc-complete__sub">{{ formattedDayLabel }}</p>

          <!-- Result stats -->
          <div class="fc-complete__stats">
            <div class="fc-complete__stat fc-complete__stat--green">
              <el-icon><CircleCheck /></el-icon>
              <span class="fc-complete__stat-value">{{ knownCount }}</span>
              <span class="fc-complete__stat-label">Đã thuộc</span>
            </div>
            <div class="fc-complete__stat fc-complete__stat--red">
              <el-icon><CircleClose /></el-icon>
              <span class="fc-complete__stat-value">{{ unknownCount }}</span>
              <span class="fc-complete__stat-label">Chưa thuộc</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="fc-complete__actions">
            <el-button @click="restartUnknown" v-if="unknownCount > 0" id="btn-restart-unknown">
              <el-icon><RefreshLeft /></el-icon>
              Ôn {{ unknownCount }} từ chưa thuộc
            </el-button>
            <el-button @click="restartAll" id="btn-restart-all">
              <el-icon><Refresh /></el-icon>
              Học lại từ đầu
            </el-button>
            <el-button type="primary" id="btn-back-to-list" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              Về danh sách
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- === FLASHCARD LEARNING SCREEN === -->
    <div v-if="!isCompleted" class="fc-view__inner container">

      <!-- Top bar: back + title + progress -->
      <div class="fc-view__topbar">
        <router-link :to="backRoute" class="fc-view__back" id="fc-back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span class="fc-view__back-label">{{ formattedDayLabel }}</span>
        </router-link>

        <!-- Progress bar tổng thẻ -->
        <div class="fc-view__progress-bar">
          <el-progress
            :percentage="progressPercent"
            :stroke-width="6"
            :show-text="false"
            :color="progressPercent === 100 ? '#3fb950' : '#4f8ef7'"
          />
        </div>

        <!-- Keyboard hint (desktop only) -->
        <div class="fc-view__kb-hint">
          <span>Space: lật</span>
          <span>← →: đánh giá</span>
        </div>
      </div>

      <!-- Flashcard component — :key thay đổi → remount với fadeIn animation -->
      <div class="fc-view__card-area">
        <FlashCard
          v-if="currentWord"
          :key="currentWord.id + '-' + currentWord.dayKey"
          :word="currentWord"
          ref="flashCardRef"
          @flip="onFlip"
        />
      </div>

      <!-- Controls: Chưa thuộc / Đã thuộc -->
      <FlashCardControls
        :current="currentIndex + 1"
        :total="deck.length"
        :can-answer="true"
        @known="handleKnown"
        @unknown="handleUnknown"
      />

      <!-- Mini queue preview (5 thẻ tiếp theo) -->
      <div class="fc-view__queue">
        <div
          v-for="(w, i) in upcomingWords"
          :key="i"
          class="fc-view__queue-dot"
          :class="{
            'fc-view__queue-dot--current': i === 0,
          }"
        ></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVocabularyStore } from '@/store/vocabulary'
import FlashCard from '@/components/flashcard/FlashCard.vue'
import FlashCardControls from '@/components/flashcard/FlashCardControls.vue'

const route  = useRoute()
const router = useRouter()
const store  = useVocabularyStore()

// Ref tới FlashCard component để gọi flip()
const flashCardRef = ref(null)

// Lấy dayKey hoặc mode my-list từ route
const isMyList = computed(() => route.name === 'flashcard-mylist')
const dayKey = computed(() =>
  isMyList.value ? 'my-list' : decodeURIComponent(route.params.dayKey)
)

// Label hiển thị
const formattedDayLabel = computed(() =>
  isMyList.value ? 'Từ vựng của tôi' : dayKey.value.replace('day ', 'Ngày ')
)

// Route quay lại
const backRoute = computed(() =>
  isMyList.value
    ? { name: 'my-list' }
    : { name: 'day', params: { dayKey: dayKey.value } }
)

function goBack() {
  router.push(backRoute.value)
}

// Deck từ học
const deck = ref([])
// Cờ đánh dấu deck đã sẵn sàng — ngăn hiển thị completion screen khi deck chưa load
const deckReady = ref(false)
// Index thẻ hiện tại (khai báo trước loadDeck vì loadDeck dùng nó)
const currentIndex = ref(0)

function initDeck(wordsToUse) {
  // Shuffle để học ngẫu nhiên
  deck.value = [...wordsToUse].sort(() => Math.random() - 0.5)
}

// Hàm load deck — dùng watch thay vì onMounted để hoạt động
// đúng khi điều hướng SPA (route thay đổi mà component không remount)
function loadDeck() {
  // Guard: chỉ chạy khi đang ở route flashcard
  // Khi navigate đi, route.name thay đổi trước → watch fire → gây conflict
  if (route.name !== 'flashcard' && route.name !== 'flashcard-mylist') return

  deckReady.value = false
  currentIndex.value = 0

  let words
  if (isMyList.value) {
    words = store.bookmarkedWords
  } else {
    words = store.getWordsByDay(dayKey.value)
  }

  if (!words || !words.length) {
    return
  }

  initDeck(words)
  deckReady.value = true
}

// Watch dayKey → load lại deck khi route thay đổi
// immediate: true → chạy ngay khi component mount (thay thế onMounted)
watch(dayKey, loadDeck, { immediate: true })

// Từ hiện tại
const currentWord = computed(() => deck.value[currentIndex.value] || null)

// Danh sách thẻ sắp tới (tối đa 7 dots)
const upcomingWords = computed(() =>
  deck.value.slice(currentIndex.value, currentIndex.value + 7)
)

// Hoàn thành khi hết thẻ VÀ deck đã sẵn sàng
const isCompleted = computed(() => deckReady.value && currentIndex.value >= deck.value.length)

// Stats kết quả
const knownCount   = computed(() => deck.value.filter(w =>
  store.getWordStatus(w.dayKey, w.id) === 'known').length
)
const unknownCount = computed(() => deck.value.filter(w =>
  store.getWordStatus(w.dayKey, w.id) !== 'known').length
)

// Progress %
const progressPercent = computed(() =>
  deck.value.length ? Math.round((currentIndex.value / deck.value.length) * 100) : 0
)

// Trạng thái đã lật hay chưa
const hasFlipped = ref(false)
function onFlip(flipped) {
  hasFlipped.value = flipped
}

// === Xử lý đánh giá ===
function handleKnown() {
  if (!currentWord.value) return
  store.markKnown(currentWord.value.dayKey, currentWord.value.id)
  nextCard()
}

function handleUnknown() {
  if (!currentWord.value) return
  store.markUnknown(currentWord.value.dayKey, currentWord.value.id)
  nextCard()
}

function nextCard() {
  hasFlipped.value = false
  currentIndex.value++
}

// Học lại từ chưa thuộc
function restartUnknown() {
  const unknownWords = deck.value.filter(w =>
    store.getWordStatus(w.dayKey, w.id) !== 'known'
  )
  initDeck(unknownWords)
  currentIndex.value = 0
}

// Học lại từ đầu
function restartAll() {
  let words = isMyList.value
    ? store.bookmarkedWords
    : store.getWordsByDay(dayKey.value)
  initDeck(words)
  currentIndex.value = 0
}

// === Keyboard handler ===
function handleKeydown(e) {
  if (isCompleted.value) return

  switch (e.key) {
    case ' ':
    case 'Spacebar':
      e.preventDefault()
      // Gọi flip() trên FlashCard ref
      flashCardRef.value?.flip()
      break
    case 'ArrowRight':
      handleKnown()
      break
    case 'ArrowLeft':
      handleUnknown()
      break
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.fc-view {
  min-height: calc(100vh - #{$header-height});
  display: flex;
  flex-direction: column;
}

// --- Learning Screen ---
.fc-view__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-6;
  padding-top: $space-6;
  padding-bottom: $space-8;
}

// Top bar
.fc-view__topbar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: $space-4;
}

.fc-view__back {
  display: flex;
  align-items: center;
  gap: $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  text-decoration: none;
  transition: $transition-fast;
  white-space: nowrap;

  &:hover { color: $color-primary; }
}

.fc-view__back-label {
  display: none;
  @media (min-width: $bp-sm) { display: inline; }
}

.fc-view__progress-bar {
  flex: 1;
}

.fc-view__kb-hint {
  display: none;
  gap: $space-3;
  font-size: $font-size-xs;
  color: $color-text-muted;
  white-space: nowrap;

  @media (min-width: $bp-md) {
    display: flex;
  }
}

// Card area — kích thước cố định để không bị giật khi swap
.fc-view__card-area {
  width: 100%;
  max-width: 560px;
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

// Card swap transition: chỉ dùng opacity, không transform layout
.card-swap-enter-active {
  transition: opacity 0.2s ease 0.05s; // delay nhỏ để leave xong trước
}
.card-swap-leave-active {
  transition: opacity 0.15s ease;
}
.card-swap-enter-from {
  opacity: 0;
}
.card-swap-leave-to {
  opacity: 0;
}

// Queue dots
.fc-view__queue {
  display: flex;
  gap: $space-2;
  align-items: center;
}

.fc-view__queue-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $color-border;
  transition: $transition-fast;

  &--current {
    width: 20px;
    border-radius: $radius-full;
    background: $color-primary;
  }
}

// === Completion Screen ===
.fc-complete {
  min-height: calc(100vh - #{$header-height});
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6 0;
}

.fc-complete__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-5;
  text-align: center;
  max-width: 400px;
  padding: $space-10 $space-6;
  background: $color-card;
  border: 1px solid $color-border;
  border-radius: $radius-2xl;
  box-shadow: $shadow-lg;
  animation: fadeInScale 0.5s ease;
}

.fc-complete__emoji {
  font-size: 4rem;
  animation: pulse 1s ease 3;
}

.fc-complete__title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-extrabold;
  letter-spacing: -0.02em;
  margin: 0;
}

.fc-complete__sub {
  color: $color-text-secondary;
  margin: 0;
}

.fc-complete__stats {
  display: flex;
  gap: $space-6;
}

.fc-complete__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;

  .el-icon { font-size: 1.5rem; }

  &--green { color: $color-success; }
  &--red   { color: $color-danger; }
}

.fc-complete__stat-value {
  font-size: $font-size-3xl;
  font-weight: $font-weight-extrabold;
  line-height: 1;
}

.fc-complete__stat-label {
  font-size: $font-size-xs;
  color: $color-text-muted;
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fc-complete__actions {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  width: 100%;

  a { text-decoration: none; width: 100%; }
  .el-button { width: 100%; }
}
</style>
