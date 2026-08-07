/**
 * v-reveal — 滚动渐入指令
 * 用法：v-reveal 或 v-reveal="120"（延迟毫秒）或 v-reveal="{ delay: 120 }"
 * 元素进入视口时添加 .reveal-in，配合 main.css 中的过渡样式工作。
 * 注意：必须是通用插件（非 .client.ts），且提供 getSSRProps 空实现，
 * 否则 SSR 渲染会因指令未注册而抛 getSSRProps undefined 错误。
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    // SSR：指令在服务端不产生任何属性/效果，仅保证渲染不报错
    getSSRProps: () => ({}),
    mounted(el: HTMLElement, binding) {
      // 尊重用户的减弱动效偏好：直接显示，不参与动画
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      el.classList.add('reveal')
      const v = binding.value
      const delay = typeof v === 'number' ? v : (v?.delay ?? 0)
      if (delay > 0) el.style.transitionDelay = `${delay}ms`

      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal-in')
              io.unobserve(entry.target)
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
      )
      io.observe(el)
      ;(el as HTMLElement & { _revealIo?: IntersectionObserver })._revealIo = io
    },
    unmounted(el: HTMLElement) {
      ;(el as HTMLElement & { _revealIo?: IntersectionObserver })._revealIo?.disconnect()
    }
  })
})
