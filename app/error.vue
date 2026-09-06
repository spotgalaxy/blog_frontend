<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error?.statusCode === 404)
const title = computed(() =>
  is404.value ? '页面走丢了' : '出了点小问题'
)
const desc = computed(() =>
  is404.value
    ? '你要找的页面不存在，可能已被移动或删除。'
    : `服务器开小差了（${props.error?.statusCode ?? 500}），稍后再试试。`
)

useHead({ title: `${title.value} · spotgalaxy` })

const goHome = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="error-shell">
    <p class="error-kicker font-serif-warm">spotgalaxy</p>
    <h1 class="error-code font-serif-warm">{{ error?.statusCode ?? 500 }}</h1>
    <h2 class="error-title font-serif-warm">{{ title }}</h2>
    <p class="error-desc">{{ desc }}</p>
    <div class="error-actions">
      <button class="error-btn primary font-serif-warm" @click="goHome">回到首页</button>
      <NuxtLink to="/blog" class="error-btn font-serif-warm">去逛逛博客</NuxtLink>
    </div>
  </div>
</template>

<style>
/* 错误页不带默认布局，自行铺满并套用主题变量 */
.error-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  background: var(--blog-background, #faf7f2);
  color: var(--blog-foreground, #1c1917);
}
html.dark .error-shell {
  background: var(--blog-background, #1c1917);
  color: var(--blog-foreground, #faf7f2);
}
.error-kicker {
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--blog-muted-foreground, #78716c);
  margin-bottom: 16px;
}
.error-code {
  font-size: clamp(5rem, 20vw, 9rem);
  font-weight: 700;
  line-height: 1;
  color: var(--blog-primary, #b45309);
  margin-bottom: 8px;
}
.error-title {
  font-size: 1.5rem;
  margin-bottom: 12px;
}
.error-desc {
  color: var(--blog-muted-foreground, #78716c);
  margin-bottom: 32px;
}
.error-actions {
  display: flex;
  gap: 16px;
}
.error-btn {
  padding: 10px 22px;
  border-radius: 999px;
  border: 1px solid var(--blog-border, #e7e5e4);
  background: var(--blog-card, #fff);
  color: inherit;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.error-btn:hover {
  color: var(--blog-primary, #b45309);
  border-color: color-mix(in srgb, var(--blog-primary, #b45309) 40%, transparent);
}
.error-btn.primary {
  background: var(--blog-primary, #b45309);
  border-color: transparent;
  color: #fff;
}
.error-btn.primary:hover {
  color: #fff;
  filter: brightness(1.05);
}
</style>
