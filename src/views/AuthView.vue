<template>
  <div class="auth-page">
    <div class="auth-container">
      <el-card class="auth-card" shadow="hover">
        <div class="auth-header">
          <div class="auth-logo">
            <el-icon><Reading /></el-icon>
          </div>
          <h2 class="auth-title">TOEIC Vocab</h2>
          <p class="auth-subtitle">Đăng nhập để đồng bộ tiến độ học tập</p>
        </div>

        <el-tabs v-model="activeTab" class="auth-tabs">
          <el-tab-pane label="Đăng nhập" name="login">
            <el-form @submit.prevent="handleLogin" :model="loginForm" label-position="top">
              <el-form-item label="Email">
                <el-input v-model="loginForm.email" type="email" placeholder="Nhập email của bạn" prefix-icon="Message" required />
              </el-form-item>
              <el-form-item label="Mật khẩu">
                <el-input v-model="loginForm.password" type="password" placeholder="Nhập mật khẩu" prefix-icon="Lock" show-password required />
              </el-form-item>
              <el-button type="primary" native-type="submit" :loading="authStore.loading" class="auth-btn">
                Đăng nhập
              </el-button>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="Đăng ký" name="register">
            <el-form @submit.prevent="handleRegister" :model="registerForm" label-position="top">
              <el-form-item label="Email">
                <el-input v-model="registerForm.email" type="email" placeholder="Nhập email của bạn" prefix-icon="Message" required />
              </el-form-item>
              <el-form-item label="Mật khẩu">
                <el-input v-model="registerForm.password" type="password" placeholder="Nhập mật khẩu (ít nhất 6 ký tự)" prefix-icon="Lock" show-password required />
              </el-form-item>
              <el-button type="primary" native-type="submit" :loading="authStore.loading" class="auth-btn">
                Đăng ký tài khoản
              </el-button>
            </el-form>
          </el-tab-pane>
        </el-tabs>

      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref('login')

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  email: '',
  password: ''
})

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) return
  
  const result = await authStore.signIn(loginForm.value.email, loginForm.value.password)
  if (result.success) {
    ElMessage.success('Đăng nhập thành công!')
    // Điều hướng về trang trước đó hoặc trang chủ
    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath)
  } else {
    ElMessage.error(result.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.')
  }
}

async function handleRegister() {
  if (!registerForm.value.email || !registerForm.value.password) return

  const result = await authStore.signUp(registerForm.value.email, registerForm.value.password)
  if (result.success) {
    ElMessage.success('Đăng ký thành công! Vui lòng đăng nhập.')
    // Chuyển sang tab đăng nhập, pre-fill email để user tiện login
    loginForm.value.email = registerForm.value.email
    loginForm.value.password = ''
    registerForm.value.password = ''
    activeTab.value = 'login'
  } else {
    ElMessage.error(result.error || 'Đăng ký thất bại. Vui lòng thử lại.')
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - #{$header-height});
  padding: $space-4;
  background: radial-gradient(circle at top right, rgba($color-primary, 0.1), transparent 40%),
              radial-gradient(circle at bottom left, rgba(#7c3aed, 0.1), transparent 40%);
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  border-radius: $radius-lg;
  border: 1px solid $color-border;
  background: rgba($color-surface, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.auth-header {
  text-align: center;
  margin-bottom: $space-6;
}

.auth-logo {
  width: 56px;
  height: 56px;
  margin: 0 auto $space-4;
  background: linear-gradient(135deg, $color-primary, #7c3aed);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba($color-primary, 0.3);
  
  .el-icon {
    font-size: 28px;
    color: white;
  }
}

.auth-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-extrabold;
  color: $color-text-primary;
  margin-bottom: $space-2;
  letter-spacing: -0.02em;
}

.auth-subtitle {
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.auth-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: $color-border;
  }
  :deep(.el-tabs__item) {
    font-weight: $font-weight-bold;
  }
}

.auth-btn {
  width: 100%;
  margin-top: $space-2;
  padding: 20px 0;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  border-radius: $radius-md;
}
</style>
