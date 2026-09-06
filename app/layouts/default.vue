<script setup lang="ts">
useHead({
  script: [
    {
      // 首屏前恢复主题，避免闪烁（FOUC）
      children:
        "(function(){try{var t=localStorage.getItem('blog-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})()",
      tagPosition: 'head'
    }
  ]
})

/* ===== 访客统计上报：路由变化即上报，后端写 visit_log（后台管理页不计入） ===== */
const route = useRoute()
watch(
  () => route.fullPath,
  (path) => {
    if (path.startsWith('/admin')) return
    $fetch('/api/stats/track', { method: 'POST', body: { path } }).catch(() => {})
  },
  { immediate: true }
)
</script>

<template>
  <div class="layout theme-fade">
    <SiteHeader />
    <div class="page-body">
      <slot />
    </div>
    <SiteFooter />
    <BackToTop />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.page-body {
  flex: 1;
  padding-top: 56px; /* fixed header 高度 */
}
</style>
