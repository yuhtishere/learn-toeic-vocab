<template>
  <div class="study-view">
    <div
      v-if="showFireworks"
      :key="fireworksKey"
      class="study-fireworks"
      aria-hidden="true"
    >
      <div
        v-for="burst in fireworkBursts"
        :key="burst.id"
        class="study-firework"
        :style="{
          left: burst.left,
          top: burst.top,
          '--firework-color': burst.color,
          '--firework-delay': burst.delay,
        }"
      >
        <span
          v-for="spark in fireworkSparks"
          :key="spark"
          class="study-firework__spark"
          :style="{ '--spark-angle': `${spark * 45}deg` }"
        ></span>
      </div>
    </div>

    <transition name="fade">
      <div v-if="isCompleted" class="study-complete">
        <div class="study-complete__card container">
          <div class="study-complete__icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <h2 class="study-complete__title">Hoàn thành</h2>
          <p class="study-complete__sub">{{ formattedDayLabel }}</p>

          <div class="study-complete__stats">
            <div class="study-complete__stat study-complete__stat--green">
              <span class="study-complete__stat-value">{{ correctCount }}</span>
              <span class="study-complete__stat-label">Đúng</span>
            </div>
            <div class="study-complete__stat study-complete__stat--red">
              <span class="study-complete__stat-value">{{ wrongCount }}</span>
              <span class="study-complete__stat-label">Sai</span>
            </div>
          </div>

          <div class="study-complete__actions">
            <el-button @click="restartAll" id="btn-study-restart">
              <el-icon><Refresh /></el-icon>
              Học lại
            </el-button>
            <el-button type="primary" id="btn-study-back" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              Về danh sách
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="!isCompleted" class="study-view__inner container">
      <div class="study-view__topbar">
        <router-link :to="backRoute" class="study-view__back" id="study-back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>{{ formattedDayLabel }}</span>
        </router-link>

        <div class="study-view__progress">
          <el-progress
            :percentage="progressPercent"
            :stroke-width="6"
            :show-text="false"
            :color="progressPercent === 100 ? '#3fb950' : '#4f8ef7'"
          />
        </div>

        <div class="study-view__counter">
          {{ currentIndex + 1 }} / {{ deck.length }}
        </div>
      </div>

      <section v-if="currentWord" class="study-card" :key="currentWord.id + '-' + currentWord.dayKey">
        <div class="study-card__meta">
          <span class="badge badge--muted">{{ currentWord.type || 'Từ vựng' }}</span>
        </div>

        <div class="study-card__prompt">
          <span class="study-card__label">Nghĩa tiếng Việt</span>
          <p class="study-card__meaning">{{ currentWord.meaning }}</p>
        </div>

        <div v-if="showHint" class="study-card__hint" id="study-hint">
          <span class="study-card__hint-label">Gợi ý</span>
          <span class="study-card__hint-value">{{ hintText }}</span>
        </div>

        <form class="study-card__form" @submit.prevent="checkAnswer">
          <el-input
            ref="answerInput"
            v-model="answer"
            size="large"
            placeholder="Nhập từ tiếng Anh"
            clearable
            id="study-answer-input"
            :disabled="isChecking"
          />

          <p
            v-if="feedback"
            class="study-card__feedback"
            :class="`study-card__feedback--${feedback.type}`"
            id="study-feedback"
          >
            {{ feedback.message }}
          </p>

          <div class="study-card__actions">
            <el-button
              native-type="submit"
              type="primary"
              size="large"
              id="btn-study-check"
              :disabled="!answer.trim() || isChecking"
            >
              Kiểm tra
            </el-button>
            <el-button
              size="large"
              id="btn-study-hint"
              @click="toggleHint"
              :disabled="isChecking"
            >
              Gợi ý
            </el-button>
            <el-button
              size="large"
              id="btn-study-skip"
              @click="skipWord"
              :disabled="isChecking"
            >
              Bỏ qua
            </el-button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVocabularyStore } from '@/store/vocabulary'

const route = useRoute()
const router = useRouter()
const store = useVocabularyStore()

const dayKey = computed(() => decodeURIComponent(route.params.dayKey))
const formattedDayLabel = computed(() => dayKey.value.replace('day ', 'Ngày '))
const backRoute = computed(() => ({ name: 'day', params: { dayKey: dayKey.value } }))

function goBack() {
  router.push(backRoute.value)
}

const deck = ref([])
const deckReady = ref(false)
const currentIndex = ref(0)
const answer = ref('')
const feedback = ref(null)
const showHint = ref(false)
const correctCount = ref(0)
const wrongCount = ref(0)
const isChecking = ref(false)
const answerInput = ref(null)
const showFireworks = ref(false)
const fireworksKey = ref(0)
let nextTimer = null
let fireworksTimer = null

const fireworkSparks = Array.from({ length: 8 }, (_, index) => index)
const fireworkBursts = [
  { id: 1, left: '18%', top: '24%', color: '#ffd166', delay: '0s' },
  { id: 2, left: '82%', top: '28%', color: '#4f8ef7', delay: '0.08s' },
  { id: 3, left: '50%', top: '16%', color: '#3fb950', delay: '0.16s' },
  { id: 4, left: '32%', top: '58%', color: '#f78166', delay: '0.24s' },
  { id: 5, left: '70%', top: '62%', color: '#c084fc', delay: '0.32s' },
]

const currentWord = computed(() => deck.value[currentIndex.value] || null)
const isCompleted = computed(() => deckReady.value && currentIndex.value >= deck.value.length)
const progressPercent = computed(() =>
  deck.value.length ? Math.round((currentIndex.value / deck.value.length) * 100) : 0
)
const hintText = computed(() => {
  const word = currentWord.value?.word?.trim() || ''
  return Array.from(word).slice(0, 2).join('')
})

function initDeck(wordsToUse) {
  deck.value = [...wordsToUse].sort(() => Math.random() - 0.5)
}

function loadDeck() {
  if (route.name !== 'study') return

  deckReady.value = false
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
  resetAnswerState()

  const words = store.getWordsByDay(dayKey.value)
  if (!words.length) {
    router.replace({ name: 'home' })
    return
  }

  initDeck(words)
  deckReady.value = true
  focusInput()
}

watch(dayKey, loadDeck, { immediate: true })

function normalizeAnswer(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function checkAnswer() {
  if (!currentWord.value || isChecking.value) return

  const submitted = normalizeAnswer(answer.value)
  const expected = normalizeAnswer(currentWord.value.word)

  if (submitted === expected) {
    isChecking.value = true
    correctCount.value++
    store.markKnown(currentWord.value.dayKey, currentWord.value.id)
    feedback.value = { type: 'success', message: 'Đúng rồi' }
    triggerFireworks()
    nextTimer = window.setTimeout(nextWord, 900)
  } else {
    wrongCount.value++
    store.markUnknown(currentWord.value.dayKey, currentWord.value.id)
    feedback.value = { type: 'error', message: 'Chưa đúng, hãy thử lại' }
  }
}

function skipWord() {
  if (!currentWord.value || isChecking.value) return

  wrongCount.value++
  store.markUnknown(currentWord.value.dayKey, currentWord.value.id)
  nextWord()
}

function nextWord() {
  clearNextTimer()
  currentIndex.value++
  isChecking.value = false
  resetAnswerState()
  focusInput()
}

function resetAnswerState() {
  answer.value = ''
  feedback.value = null
  showHint.value = false
}

function toggleHint() {
  showHint.value = !showHint.value
  focusInput()
}

function restartAll() {
  const words = store.getWordsByDay(dayKey.value)
  initDeck(words)
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
  isChecking.value = false
  resetAnswerState()
  focusInput()
}

function triggerFireworks() {
  clearFireworksTimer()
  fireworksKey.value++
  showFireworks.value = true
  fireworksTimer = window.setTimeout(() => {
    showFireworks.value = false
    fireworksTimer = null
  }, 950)
}

function focusInput() {
  nextTick(() => {
    answerInput.value?.focus?.()
  })
}

function clearNextTimer() {
  if (nextTimer) {
    window.clearTimeout(nextTimer)
    nextTimer = null
  }
}

function clearFireworksTimer() {
  if (fireworksTimer) {
    window.clearTimeout(fireworksTimer)
    fireworksTimer = null
  }
}

onUnmounted(() => {
  clearNextTimer()
  clearFireworksTimer()
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.study-view {
  position: relative;
  min-height: calc(100vh - #{$header-height});
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.study-fireworks {
  position: fixed;
  inset: $header-height 0 0;
  z-index: 0;
  pointer-events: none;
}

.study-firework {
  position: absolute;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%);
  animation: fireworkCore 0.75s ease-out var(--firework-delay) both;
}

.study-firework__spark {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 18px;
  border-radius: $radius-full;
  background: var(--firework-color);
  box-shadow: 0 0 14px var(--firework-color);
  transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0) scale(0.25);
  transform-origin: center;
  opacity: 0;
  animation: fireworkSpark 0.75s ease-out var(--firework-delay) both;
}

@keyframes fireworkCore {
  0% {
    opacity: 1;
    box-shadow: 0 0 0 0 var(--firework-color);
  }
  100% {
    opacity: 0;
    box-shadow: 0 0 0 28px rgba(255, 255, 255, 0);
  }
}

@keyframes fireworkSpark {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0) scale(0.25);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(-88px) scale(1);
  }
}

.study-view__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-6;
  padding-top: $space-6;
  padding-bottom: $space-8;
}

.study-view__topbar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: $space-4;
}

.study-view__back {
  display: flex;
  align-items: center;
  gap: $space-2;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  text-decoration: none;
  white-space: nowrap;
  transition: $transition-fast;

  &:hover {
    color: $color-primary;
  }
}

.study-view__progress {
  flex: 1;
}

.study-view__counter {
  min-width: 64px;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  text-align: right;
}

.study-card {
  width: 100%;
  max-width: 620px;
  min-height: 360px;
  display: flex;
  flex-direction: column;
  gap: $space-5;
  padding: $space-6;
  background: $color-card;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
  animation: fadeIn 0.25s ease both;
}

.study-card__meta {
  display: flex;
  justify-content: flex-end;
  min-height: 24px;
}

.study-card__prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  padding: $space-6 $space-4;
  text-align: center;
  border-radius: $radius-md;
  background: rgba($color-success, 0.08);
  border: 1px solid rgba($color-success, 0.22);
}

.study-card__label,
.study-card__hint-label {
  color: $color-text-muted;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  text-transform: uppercase;
}

.study-card__meaning {
  margin: 0;
  color: $color-text-primary;
  font-size: $font-size-2xl;
  font-weight: $font-weight-bold;
  line-height: 1.4;
  word-break: break-word;
}

.study-card__hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-3 $space-4;
  border: 1px solid rgba($color-primary, 0.3);
  border-radius: $radius-md;
  background: rgba($color-primary, 0.08);
}

.study-card__hint-value {
  color: $color-primary;
  font-size: $font-size-xl;
  font-weight: $font-weight-extrabold;
}

.study-card__form {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.study-card__feedback {
  min-height: 22px;
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;

  &--success {
    color: $color-success;
  }

  &--error {
    color: $color-danger;
  }
}

.study-card__actions {
  display: flex;
  gap: $space-3;
  flex-wrap: wrap;

  .el-button {
    flex: 1;
    min-width: 120px;
  }
}

.study-complete {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - #{$header-height});
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-6 0;
}

.study-complete__card {
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-5;
  padding: $space-10 $space-6;
  text-align: center;
  background: $color-card;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  box-shadow: $shadow-lg;
}

.study-complete__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: $color-success;
  font-size: 2.25rem;
  border: 1px solid rgba($color-success, 0.35);
  border-radius: $radius-full;
  background: rgba($color-success, 0.12);
}

.study-complete__title {
  margin: 0;
  color: $color-text-primary;
  font-size: $font-size-3xl;
  font-weight: $font-weight-extrabold;
}

.study-complete__sub {
  margin: 0;
  color: $color-text-secondary;
}

.study-complete__stats {
  display: flex;
  gap: $space-6;
}

.study-complete__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-1;

  &--green {
    color: $color-success;
  }

  &--red {
    color: $color-danger;
  }
}

.study-complete__stat-value {
  font-size: $font-size-3xl;
  font-weight: $font-weight-extrabold;
  line-height: 1;
}

.study-complete__stat-label {
  color: $color-text-muted;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  text-transform: uppercase;
}

.study-complete__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $space-3;

  a {
    width: 100%;
    text-decoration: none;
  }

  .el-button {
    width: 100%;
  }
}

@media (max-width: $bp-sm) {
  .study-view__topbar {
    gap: $space-3;
  }

  .study-view__back span {
    display: none;
  }

  .study-card {
    padding: $space-4;
  }

  .study-card__meaning {
    font-size: $font-size-xl;
  }
}
</style>
