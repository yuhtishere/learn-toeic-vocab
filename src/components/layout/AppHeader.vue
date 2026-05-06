<template>
  <!-- ============================================================
    AppHeader — Fixed top navigation bar
  ============================================================ -->
  <header class="app-header" id="app-header">
    <div class="app-header__inner container">

      <!-- Logo & Brand -->
      <router-link :to="{ name: 'home' }" class="app-header__brand" id="header-logo">
        <div class="app-header__logo">
          <el-icon class="app-header__logo-icon"><Reading /></el-icon>
        </div>
        <div class="app-header__brand-text">
          <span class="app-header__brand-name">TOEIC</span>
          <span class="app-header__brand-sub">Vocab</span>
        </div>
      </router-link>

      <!-- Desktop Navigation -->
      <nav class="app-header__nav" aria-label="Điều hướng chính">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="app-header__nav-link"
          :id="`header-nav-${item.name}`"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Actions -->
      <div class="app-header__actions">
        <!-- Search button -->
        <button class="app-header__action-btn" id="header-search" @click="showSearch = true" title="Tìm kiếm (Ctrl+K)">
          <el-icon><Search /></el-icon>
        </button>

        <!-- Bookmark -->
        <router-link :to="{ name: 'my-list' }" class="app-header__bookmark-btn" id="header-bookmark">
          <el-icon><Star /></el-icon>
          <span
            v-if="bookmarkCount > 0"
            class="app-header__bookmark-count"
          >{{ bookmarkCount }}</span>
        </router-link>
      </div>

    </div>
  </header>

  <!-- Global Search Dialog -->
  <GlobalSearch :visible="showSearch" @close="showSearch = false" @open="showSearch = true" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVocabularyStore } from '@/store/vocabulary'
import GlobalSearch from './GlobalSearch.vue'

const store = useVocabularyStore()
const showSearch = ref(false)

// Số từ đã bookmark
const bookmarkCount = computed(() => store.bookmarkedIds.length)

// Danh sách nav items
const navItems = [
  { name: 'home',    to: { name: 'home' },    label: 'Trang chủ', icon: 'House' },
  { name: 'mylist',  to: { name: 'my-list' }, label: 'Từ của tôi', icon: 'CollectionTag' },
]
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: $header-height;
  background: rgba($color-surface, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid $color-border;
  z-index: $z-header;

  &__inner {
    display: flex;
    align-items: center;
    height: 100%;
    gap: $space-4;
  }

  // --- Brand ---
  &__brand {
    display: flex;
    align-items: center;
    gap: $space-3;
    text-decoration: none;
    flex-shrink: 0;
  }

  &__logo {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, $color-primary, #7c3aed);
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 12px rgba($color-primary, 0.4);
  }

  &__logo-icon {
    font-size: 1.1rem;
    color: white;
  }

  &__brand-text {
    display: flex;
    align-items: baseline;
    gap: $space-1;
  }

  &__brand-name {
    font-size: $font-size-lg;
    font-weight: $font-weight-extrabold;
    color: $color-text-primary;
    letter-spacing: -0.02em;
  }

  &__brand-sub {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-primary;
  }

  // --- Desktop Nav ---
  &__nav {
    display: none;
    align-items: center;
    gap: $space-1;
    margin-left: auto;

    @media (min-width: $bp-md) {
      display: flex;
    }
  }

  &__nav-link {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    text-decoration: none;
    transition: $transition-fast;

    &:hover {
      color: $color-text-primary;
      background: $color-card;
    }

    &.router-link-active {
      color: $color-primary;
      background: rgba($color-primary, 0.1);
    }
  }

  // --- Actions ---
  &__actions {
    display: flex;
    align-items: center;
    gap: $space-1;
    margin-left: auto;

    @media (min-width: $bp-md) {
      margin-left: $space-4;
    }
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    border: none;
    background: transparent;
    color: $color-text-secondary;
    font-size: 1.2rem;
    cursor: pointer;
    transition: $transition-fast;

    &:hover {
      color: $color-primary;
      background: rgba($color-primary, 0.1);
    }
  }

  &__bookmark-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    color: $color-text-secondary;
    transition: $transition-fast;
    text-decoration: none;
    font-size: 1.2rem;

    &:hover {
      color: $color-gold;
      background: rgba($color-gold, 0.1);
    }
  }

  &__bookmark-count {
    position: absolute;
    top: 4px;
    right: 4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: $color-primary;
    color: white;
    font-size: 10px;
    font-weight: $font-weight-bold;
    border-radius: $radius-full;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
}
</style>
