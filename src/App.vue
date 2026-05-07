<template>
  <!-- Root app layout -->
  <div class="app-wrapper">
    <!-- Header cố định trên cùng -->
    <AppHeader />

    <!-- Main content area — router views render ở đây -->
    <main class="main-content">
      <router-view />
    </main>

    <footer class="app-footer">
      Developed by Yuht
    </footer>

    <!-- Bottom navigation (chỉ hiện trên mobile) -->
    <BottomNav />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useVocabularyStore } from '@/store/vocabulary'
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'

const authStore  = useAuthStore()
const vocabStore = useVocabularyStore()

onMounted(async () => {
  // Bước 1: Restore auth session từ Supabase cookie
  await authStore.initialize()
  // Bước 2: Nếu đã login → fetch tiến độ từ Supabase
  if (authStore.isLoggedIn) {
    await vocabStore.fetchUserProgress(authStore.userId)
  }
})

// Reactive: tự động load/clear khi login hoặc logout
// (Xử lý cả trường hợp login từ tab khác hoặc token refresh)
watch(() => authStore.isLoggedIn, async (loggedIn) => {
  if (loggedIn) {
    await vocabStore.fetchUserProgress(authStore.userId)
  } else {
    vocabStore.clearUserProgress()
  }
})
</script>

<style lang="scss">
@use "@/assets/styles/variables.scss" as *;

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $color-bg;
}

.app-footer {
  padding: $space-4 $space-6 calc(#{$bottom-nav-height} + #{$space-4});
  border-top: 1px solid $color-border;
  color: $color-text-muted;
  font-size: $font-size-sm;
  text-align: center;
  background: $color-surface;

  @media (min-width: $bp-md) {
    padding: $space-4 $space-6;
  }
}
</style>
