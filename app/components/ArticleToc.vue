<script setup lang="ts">
/**
 * 文章/作品详情共用的目录侧边栏。
 * 桌面端：右侧粘性侧栏（由页面 grid 提供 240px 列），可折叠为窄栏；
 * 移动端（≤1024px）：悬浮按钮 + 右侧滑抽屉（Teleport 到 body）。
 * 页面需提供 .article-content 渲染容器，并以 v-model:collapsed / @update:has-toc
 * 接收折叠状态与"是否有目录"，用于调整自身 grid 列宽。
 */
const props = defineProps<{
  /** Markdown 原文，仅用于 SSR 首屏目录兜底 */
  markdown?: string
  /** 渲染结果引用：变化时（客户端路由/数据刷新）重建目录 */
  rendered?: unknown
  collapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:collapsed', v: boolean): void
  (e: 'update:hasToc', v: boolean): void
}>()

interface TocItem {
  id: string
  text: string
  level: number
}

const toc = ref<TocItem[]>([])
const activeId = ref('')
const drawerOpen = ref(false)

// SSR 首屏：先用 markdown 解析生成目录，避免空侧栏闪烁
if (import.meta.server) {
  toc.value = extractHeadings(props.markdown ?? '').map((h, i) => ({
    ...h,
    id: `toc-${i}`
  }))
}

watch(
  () => toc.value.length > 0,
  (v) => emit('update:hasToc', v),
  { immediate: true }
)

// 从渲染后的正文 DOM 重建目录，并给标题打上索引 id —— 目录与跳转目标严格同源
function buildTocFromDom() {
  if (!import.meta.client) return false
  const root = document.querySelector('.article-content')
  if (!root) return false
  const els = Array.from(root.querySelectorAll('h2, h3, h4')) as HTMLElement[]
  if (!els.length) return false
  toc.value = els.map((el, i) => {
    el.id = `toc-${i}`
    return {
      id: `toc-${i}`,
      text: (el.textContent ?? '').trim(),
      level: Number(el.tagName.charAt(1)) // h2 → 2, h3 → 3, h4 → 4
    }
  })
  return true
}

let headingObserver: IntersectionObserver | null = null

function setupObserver() {
  if (!import.meta.client) return
  headingObserver?.disconnect()
  headingObserver = null
  const root = document.querySelector('.article-content')
  if (!root) return
  const els = Array.from(root.querySelectorAll('h2, h3, h4')) as HTMLElement[]
  if (!els.length) return
  activeId.value = els[0].id
  headingObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activeId.value = (e.target as HTMLElement).id
      }
    },
    { rootMargin: '0px 0px -70% 0px', threshold: 0 }
  )
  els.forEach((el) => headingObserver!.observe(el))
}

onMounted(() => {
  // 内容渲染完成后从 DOM 重建目录并监听滚动高亮
  const ensure = () => {
    if (buildTocFromDom()) setupObserver()
  }
  nextTick(() => {
    if (!buildTocFromDom()) requestAnimationFrame(ensure)
    else setupObserver()
  })
})

// 兜底：客户端路由切换时内容可能稍后才到，rendered 有值后再重建一次
watch(
  () => props.rendered,
  () => {
    if (import.meta.client) {
      nextTick(() => {
        if (buildTocFromDom()) setupObserver()
      })
    }
  }
)

onBeforeUnmount(() => {
  headingObserver?.disconnect()
})

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  activeId.value = id
  history.replaceState(null, '', `#${id}`)
}

// 抽屉内点击目录项：跳转后关闭抽屉
function goTo(id: string) {
  scrollToId(id)
  drawerOpen.value = false
}

// 目录当前项自动滚动到可视区域
watch(activeId, () => {
  if (!import.meta.client) return
  nextTick(() => {
    const aside = document.querySelector<HTMLElement>('.article-toc')
    const link = aside?.querySelector<HTMLElement>('.toc-item.active .toc-link')
    if (!aside || !link) return
    const above = link.offsetTop < aside.scrollTop
    const below = link.offsetTop + link.offsetHeight > aside.scrollTop + aside.clientHeight
    if (above || below) {
      aside.scrollTo({
        top: link.offsetTop - aside.clientHeight / 2,
        behavior: 'smooth'
      })
    }
  })
})
</script>

<template>
  <!-- ===== 右侧目录侧边栏（可折叠） ===== -->
  <aside v-if="toc.length" class="article-toc" :class="{ collapsed }">
    <button
      type="button"
      class="toc-toggle"
      :aria-expanded="String(!collapsed)"
      :title="collapsed ? '展开目录' : '收起目录'"
      @click="emit('update:collapsed', !collapsed)"
    >
      <span class="toc-toggle-text">目录</span>
      <span class="toc-chevron">{{ collapsed ? '‹' : '»' }}</span>
    </button>
    <div class="toc-inner">
      <ul class="toc-list">
        <li
          v-for="item in toc"
          :key="item.id"
          class="toc-item"
          :class="['lvl-' + item.level, { active: activeId === item.id }]"
        >
          <a :href="'#' + item.id" class="toc-link font-serif-warm" @click.prevent="scrollToId(item.id)">
            {{ item.text }}
          </a>
        </li>
      </ul>
    </div>
  </aside>

  <!-- ===== 移动端目录：悬浮按钮 + 侧滑抽屉 ===== -->
  <Teleport to="body">
    <button
      v-if="toc.length"
      type="button"
      class="toc-fab font-serif-warm"
      aria-label="打开目录"
      @click="drawerOpen = true"
    >
      目录
    </button>

    <Transition name="mask-fade">
      <div v-if="drawerOpen" class="toc-drawer-mask" @click="drawerOpen = false">
        <Transition name="drawer-slide" appear>
          <div class="toc-drawer" @click.stop>
            <div class="toc-drawer-head">
              <span class="toc-drawer-title font-serif-warm">目录</span>
              <button type="button" class="toc-drawer-close" aria-label="关闭目录" @click="drawerOpen = false">×</button>
            </div>
            <ul class="toc-list">
              <li
                v-for="item in toc"
                :key="item.id"
                class="toc-item"
                :class="['lvl-' + item.level, { active: activeId === item.id }]"
              >
                <a :href="'#' + item.id" class="toc-link font-serif-warm" @click.prevent="goTo(item.id)">
                  {{ item.text }}
                </a>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ===== 目录侧边栏 ===== */
.article-toc {
  position: sticky;
  top: 88px;
  align-self: start;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  transition: max-width 0.25s ease;
}

/* 目录标题 + 折叠开关（展开态） */
.toc-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 16px;
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--blog-muted-foreground);
  transition: color 0.2s ease;
}
.toc-toggle:hover {
  color: var(--blog-foreground);
}
.toc-chevron {
  font-size: 1.05rem;
  line-height: 1;
  color: var(--blog-muted-foreground);
  transition: transform 0.25s ease;
}
.toc-toggle:hover .toc-chevron {
  color: var(--blog-primary);
}

/* 收起态：只剩一条 48px 窄栏，竖排「目录」二字可再次展开 */
.article-toc.collapsed {
  overflow: visible;
  max-height: none;
}
.article-toc.collapsed .toc-inner {
  display: none;
}
.article-toc.collapsed .toc-toggle {
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 16px 0;
  writing-mode: vertical-rl;
  letter-spacing: 0.4em;
}
.article-toc.collapsed .toc-chevron {
  display: none;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.toc-link {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--blog-muted-foreground);
  text-decoration: none;
  border-left: 2px solid transparent;
  padding: 5px 0 5px 14px;
  margin-left: -1px;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.toc-item.lvl-3 .toc-link {
  padding-left: 26px;
}
.toc-item.lvl-4 .toc-link {
  padding-left: 38px;
}
.toc-link:hover {
  color: var(--blog-foreground);
}
.toc-item.active .toc-link {
  color: var(--blog-primary);
  border-left-color: var(--blog-primary);
  font-weight: 500;
}

/* ===== 移动端目录：悬浮按钮 ===== */
.toc-fab {
  position: fixed;
  right: 16px;
  bottom: 24px;
  z-index: 70;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  border: 1px solid var(--blog-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--blog-card) 90%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--blog-foreground);
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}
.toc-fab:hover {
  color: var(--blog-primary);
  transform: translateY(-2px);
}

/* ===== 移动端目录：侧滑抽屉 ===== */
.toc-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: flex-end;
}
.toc-drawer {
  width: min(80vw, 320px);
  height: 100%;
  background: var(--blog-card);
  border-left: 1px solid var(--blog-border);
  padding: 20px 16px;
  overflow-y: auto;
}
.toc-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 14px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--blog-border);
}
.toc-drawer-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--blog-foreground);
}
.toc-drawer-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--blog-muted-foreground);
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s ease;
}
.toc-drawer-close:hover {
  color: var(--blog-foreground);
}
/* 抽屉内目录项稍大、更易点按 */
.toc-drawer .toc-link {
  font-size: 0.875rem;
  padding: 8px 0 8px 14px;
}
.toc-drawer .toc-item.lvl-3 .toc-link {
  padding-left: 26px;
}
.toc-drawer .toc-item.lvl-4 .toc-link {
  padding-left: 38px;
}

/* 抽屉过渡动画 */
.mask-fade-enter-active,
.mask-fade-leave-active {
  transition: opacity 0.25s ease;
}
.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.28s ease;
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}

/* ===== 窄屏：隐藏右侧栏，改由悬浮按钮 + 抽屉接管 ===== */
@media (max-width: 1024px) {
  .article-toc {
    display: none;
  }
  .toc-fab {
    display: inline-flex;
  }
}
</style>
