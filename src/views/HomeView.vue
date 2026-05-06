<template>
  <!-- ============================================================
    HomeView — Trang chủ: Grid 30 thẻ ngày
  ============================================================ -->
  <div class="home-view">
    <div class="container">

      <!-- Hero section -->
      <section class="home-hero">
        <div class="home-hero__badge">
          <el-icon><Trophy /></el-icon>
          TOEIC Vocabulary Master
        </div>
        <h1 class="home-hero__title">
          Học từ vựng<br />
          <span class="home-hero__title-highlight">30 ngày chinh phục</span>
        </h1>
        <p class="home-hero__desc">
          {{ totalWords }} từ vựng thiết yếu · Học theo lộ trình · Ôn luyện với Flashcard
        </p>

        <!-- Overall stats -->
        <div class="home-stats">
          <div class="home-stats__item">
            <span class="home-stats__value">{{ totalKnown }}</span>
            <span class="home-stats__label">Đã thuộc</span>
          </div>
          <div class="home-stats__divider"></div>
          <div class="home-stats__item">
            <span class="home-stats__value">{{ totalWords - totalKnown }}</span>
            <span class="home-stats__label">Chưa thuộc</span>
          </div>
          <div class="home-stats__divider"></div>
          <div class="home-stats__item">
            <span class="home-stats__value">{{ overallPercent }}%</span>
            <span class="home-stats__label">Hoàn thành</span>
          </div>
        </div>

        <!-- Overall progress bar -->
        <div class="home-progress-bar">
          <el-progress
            :percentage="overallPercent"
            :stroke-width="8"
            :show-text="false"
            status="success"
          />
        </div>
      </section>

      <!-- Day grid -->
      <section class="home-grid">
        <h2 class="home-grid__title">Chọn ngày học</h2>

        <div class="home-grid__cards">
          <router-link
            v-for="(dayKey, idx) in dayKeys"
            :key="dayKey"
            :to="{ name: 'day', params: { dayKey } }"
            class="day-card"
            :class="getDayCardClass(dayKey)"
            :id="`day-card-${idx + 1}`"
            :style="{ animationDelay: `${idx * 30}ms` }"
          >
            <!-- Day number badge -->
            <div class="day-card__number">{{ idx + 1 }}</div>

            <!-- Word count -->
            <div class="day-card__info">
              <span class="day-card__word-count">
                {{ getDayWordCount(dayKey) }} từ
              </span>
              <span class="day-card__known">
                {{ getKnownCount(dayKey) }} thuộc
              </span>
            </div>

            <!-- Progress ring (mini circular) -->
            <div class="day-card__progress">
              <el-progress
                type="circle"
                :percentage="getProgressPercent(dayKey)"
                :width="44"
                :stroke-width="4"
                :show-text="false"
                :color="getProgressColor(dayKey)"
              />
              <span class="day-card__percent">{{ getProgressPercent(dayKey) }}%</span>
            </div>

            <!-- Completed overlay -->
            <div v-if="getProgressPercent(dayKey) === 100" class="day-card__completed">
              <el-icon><CircleCheck /></el-icon>
            </div>

          </router-link>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useVocabularyStore } from '@/store/vocabulary'
import database from '../../database.json'

const store = useVocabularyStore()

// Danh sách tất cả các ngày
const dayKeys = computed(() => Object.keys(database))

// Tổng số từ
const totalWords = computed(() =>
  Object.values(database).reduce((sum, words) => sum + words.length, 0)
)

// Tổng số từ đã thuộc
const totalKnown = computed(() =>
  dayKeys.value.reduce((sum, dk) => sum + store.knownCountByDay(dk), 0)
)

// % tổng thể
const overallPercent = computed(() =>
  totalWords.value ? Math.round((totalKnown.value / totalWords.value) * 100) : 0
)

// Helpers cho từng ngày
function getDayWordCount(dayKey) {
  return (database[dayKey] || []).length
}
function getKnownCount(dayKey) {
  return store.knownCountByDay(dayKey)
}
function getProgressPercent(dayKey) {
  return store.progressPercentByDay(dayKey)
}

// Màu progress ring theo % hoàn thành
function getProgressColor(dayKey) {
  const pct = getProgressPercent(dayKey)
  if (pct === 100) return '#3fb950'
  if (pct >= 50)  return '#4f8ef7'
  if (pct > 0)    return '#e6a817'
  return '#30363d'
}

// CSS class cho day card theo % hoàn thành
function getDayCardClass(dayKey) {
  const pct = getProgressPercent(dayKey)
  if (pct === 100) return 'day-card--completed'
  if (pct > 0)     return 'day-card--in-progress'
  return ''
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.home-view {
  padding: $space-8 0 $space-12;
}

// ============================================================
// Hero
// ============================================================
.home-hero {
  text-align: center;
  padding: $space-10 0 $space-8;
  max-width: 600px;
  margin: 0 auto;

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    background: rgba($color-primary, 0.1);
    border: 1px solid rgba($color-primary, 0.3);
    border-radius: $radius-full;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-primary;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: $space-5;
  }

  &__title {
    font-size: clamp($font-size-3xl, 6vw, $font-size-4xl);
    font-weight: $font-weight-extrabold;
    line-height: 1.2;
    margin-bottom: $space-4;
    letter-spacing: -0.02em;
  }

  &__title-highlight {
    background: linear-gradient(135deg, $color-primary, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__desc {
    font-size: $font-size-base;
    color: $color-text-secondary;
    margin-bottom: $space-6;
  }
}

// Stats row
.home-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-6;
  margin-bottom: $space-5;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-1;
  }

  &__value {
    font-size: $font-size-2xl;
    font-weight: $font-weight-extrabold;
    color: $color-text-primary;
    line-height: 1;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: $font-weight-medium;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__divider {
    width: 1px;
    height: 30px;
    background: $color-border;
  }
}

.home-progress-bar {
  max-width: 400px;
  margin: 0 auto;
}

// ============================================================
// Day Grid
// ============================================================
.home-grid {
  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-text-secondary;
    margin-bottom: $space-5;
    letter-spacing: -0.01em;
  }

  &__cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: $space-3;

    @media (min-width: $bp-md) {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: $space-4;
    }
  }
}

// ============================================================
// Day Card
// ============================================================
.day-card {
  position: relative;
  background: $color-card;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  text-decoration: none;
  transition: $transition-base;
  animation: fadeInScale 0.4s ease both;
  overflow: hidden;
  min-height: 130px;
  justify-content: space-between;

  // Hover glow
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $radius-xl;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: linear-gradient(135deg, rgba($color-primary, 0.08), transparent);
  }

  &:hover {
    border-color: rgba($color-primary, 0.5);
    transform: translateY(-3px);
    box-shadow: $shadow-md, $shadow-glow;

    &::before { opacity: 1; }
  }

  &:active {
    transform: translateY(-1px);
  }

  // In progress
  &--in-progress {
    border-color: rgba($color-gold, 0.3);
    background: rgba($color-gold, 0.04);
  }

  // Completed
  &--completed {
    border-color: rgba($color-success, 0.4);
    background: rgba($color-success, 0.05);
  }

  &__number {
    font-size: $font-size-2xl;
    font-weight: $font-weight-extrabold;
    color: $color-text-primary;
    line-height: 1;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__word-count {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    font-weight: $font-weight-medium;
  }

  &__known {
    font-size: $font-size-xs;
    color: $color-success;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: $space-2;
    align-self: flex-end;
  }

  &__percent {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: $font-weight-medium;
    min-width: 28px;
  }

  &__completed {
    position: absolute;
    top: $space-3;
    right: $space-3;
    color: $color-success;
    font-size: 1.1rem;
  }
}
</style>
