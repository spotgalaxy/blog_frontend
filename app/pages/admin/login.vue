<script setup lang="ts">
useHead({ title: '登录 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    const { data } = await apiFetch<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })
    useCookie('blog_token').value = data.token
    await navigateTo('/admin/posts')
  } catch (e: any) {
    error.value = e?.data?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-wrap">
    <form class="login-card" @submit.prevent="submit">
      <h1 class="login-title font-serif-warm">管理后台</h1>
      <input v-model="username" class="login-input" placeholder="用户名" autocomplete="username" />
      <input v-model="password" type="password" class="login-input" placeholder="密码" autocomplete="current-password" />
      <p v-if="error" class="login-error">{{ error }}</p>
      <button class="login-btn" type="submit" :disabled="loading">
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 96px 24px;
}
.login-card {
  max-width: 360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.login-title {
  font-size: 1.75rem;
  color: var(--blog-foreground);
  text-align: center;
  margin-bottom: 8px;
}
.login-input {
  padding: 10px 14px;
  border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-sm);
  background: var(--blog-card);
  color: var(--blog-foreground);
  font-size: 0.95rem;
}
.login-error { color: var(--blog-primary); font-size: 0.875rem; }
.login-btn {
  padding: 10px 14px;
  border: none;
  border-radius: var(--blog-radius-sm);
  background: var(--blog-primary);
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
}
.login-btn:disabled { opacity: 0.6; }
</style>
