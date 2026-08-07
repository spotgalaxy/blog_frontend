<script setup lang="ts">
const visible = ref(false)

const onScroll = () => {
  visible.value = window.scrollY > 600
}

const toTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <Transition name="fade-up">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
      aria-label="返回顶部"
      title="返回顶部"
      @click="toTop"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 60;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--blog-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--blog-card) 90%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--blog-muted-foreground);
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}
.back-to-top:hover {
  color: var(--blog-primary);
  border-color: color-mix(in srgb, var(--blog-primary) 40%, transparent);
  transform: translateY(-2px);
}

/* 文章页移动端右下角有「目录」悬浮按钮，错开位置 */
@media (max-width: 1024px) {
  .back-to-top {
    right: 16px;
    bottom: 80px;
  }
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
