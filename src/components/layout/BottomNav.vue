<template>
  <!-- ============================================================
    BottomNav — Mobile bottom navigation bar (ẩn trên desktop)
  ============================================================ -->
  <nav class="bottom-nav" id="bottom-nav" aria-label="Điều hướng dưới">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.to"
      class="bottom-nav__item"
      :id="`bottom-nav-${item.name}`"
    >
      <el-icon class="bottom-nav__icon">
        <component :is="item.icon" />
      </el-icon>
      <span class="bottom-nav__label">{{ item.label }}</span>

      <!-- Badge count cho bookmark -->
      <span
        v-if="item.name === 'mylist' && bookmarkCount > 0"
        class="bottom-nav__badge"
      >{{ bookmarkCount }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useVocabularyStore } from '@/store/vocabulary'

const store = useVocabularyStore()
const bookmarkCount = computed(() => store.bookmarkedIds.length)

const navItems = [
  { name: 'results', to: { name: 'quiz-results' }, label: 'Kết quả', icon: 'DataAnalysis' },
  { name: 'home',   to: { name: 'home' },    label: 'Trang chủ', icon: 'House' },
  { name: 'mylist', to: { name: 'my-list' }, label: 'Của tôi',   icon: 'Star' },
]
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: $bottom-nav-height;
  background: rgba($color-surface, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid $color-border;
  display: flex;
  align-items: center;
  z-index: $z-header;

  // Ẩn trên desktop
  @media (min-width: $bp-md) {
    display: none;
  }

  &__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $space-1;
    padding: $space-2;
    text-decoration: none;
    color: $color-text-muted;
    position: relative;
    transition: $transition-fast;

    &.router-link-active {
      color: $color-primary;

      .bottom-nav__icon {
        transform: scale(1.1);
      }
    }
  }

  &__icon {
    font-size: 1.3rem;
    transition: transform 0.2s ease;
  }

  &__label {
    font-size: 10px;
    font-weight: $font-weight-medium;
    letter-spacing: 0.02em;
  }

  &__badge {
    position: absolute;
    top: 6px;
    right: calc(50% - 20px);
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: $color-primary;
    color: white;
    font-size: 9px;
    font-weight: $font-weight-bold;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
