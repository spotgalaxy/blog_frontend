<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

interface Post {
  id: number
  slug: string
  title: string
  summary: string
  content: string
  tags: string[]
  publishedAt: string | null
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const { data: post } = await useAsyncData(`blog-${slug}`, async () => {
  try {
    const res = await $fetch<ApiEnvelope<Post>>(`/api/posts/${slug}`)
    return res.data
  } catch {
    return null
  }
})

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在' })
}

const { data: allPosts } = await useAsyncData('blog-nav', async () => {
  const res = await $fetch<ApiEnvelope<Post[]>>('/api/posts')
  return res.data
})

const prevPost = computed(() => {
  const list = allPosts.value ?? []
  const idx = list.findIndex((p) => p.slug === slug)
  return idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null
})
const nextPost = computed(() => {
  const list = allPosts.value ?? []
  const idx = list.findIndex((p) => p.slug === slug)
  return idx > 0 ? list[idx - 1] : null
})

const { data: rendered } = await useAsyncData(`render-${slug}`, () =>
  parseMarkdown(post.value!.content)
)

const minutes = readingTime(post.value.content ?? '')

useHead({
  title: `${post.value.title} · spotgalaxy`,
  meta: [{ name: 'description', content: post.value.summary }]
})

const copied = ref(false)
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* 忽略剪贴板权限错误 */
  }
}

const shareUrl = computed(() =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.value!.title)}`
)

/* ===== 右侧目录（TOC） ===== */
interface TocItem {
  id: string
  text: string
  level: number
}

// 从 Markdown 提取标题（仅作 SSR 首屏兜底，客户端会用真实 DOM 重建，保证与正文一一对应）
function extractHeadings(md: string): { level: number; text: string }[] {
  if (!md) return []
  // 去掉围栏代码块，避免把代码里的 # 误判为标题
  const cleaned = md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
  const out: { level: number; text: string }[] = []
  for (const line of cleaned.split('\n')) {
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (m) {
      const level = m[1].length
      if (level >= 2 && level <= 4) out.push({ level, text: m[2].trim() })
    }
  }
  return out
}

const toc = ref<TocItem[]>([])
const activeId = ref('')
const tocCollapsed = ref(false)
const tocDrawerOpen = ref(false)

// SSR 首屏：先用 markdown 解析生成目录，避免空侧栏闪烁
if (import.meta.server) {
  toc.value = extractHeadings(post.value?.content ?? '').map((h, i) => ({
    ...h,
    id: `toc-${i}`
  }))
}

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
  // 恢复折叠状态
  try {
    tocCollapsed.value = localStorage.getItem('toc-collapsed') === '1'
  } catch {
    /* 忽略存储异常 */
  }
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
watch(rendered, () => {
  if (import.meta.client) nextTick(() => {
    if (buildTocFromDom()) setupObserver()
  })
})

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
  tocDrawerOpen.value = false
}

watch(tocCollapsed, (v) => {
  if (import.meta.client) {
    try {
      localStorage.setItem('toc-collapsed', v ? '1' : '0')
    } catch {
      /* 忽略存储异常 */
    }
  }
})
</script>

<template>
  <main v-if="post" class="article-shell" :class="{ 'with-toc': toc.length, 'toc-collapsed': tocCollapsed && toc.length }">
    <div class="article-col">
      <!-- ===== 文章头部 ===== -->
      <section class="article-head">
        <NuxtLink to="/blog" class="back-link font-serif-warm">
          <span>&larr;</span> 返回博客列表
        </NuxtLink>

        <div class="head-tags">
          <template v-for="(tag, i) in post.tags" :key="tag">
            <span v-if="i > 0" class="tag-sep">·</span>
            <span class="head-tag font-serif-warm">{{ tag }}</span>
          </template>
        </div>

        <h1 class="head-title font-serif-warm">{{ post.title }}</h1>

        <div class="head-meta font-serif-warm">
          <time :datetime="post.publishedAt">{{ formatDateFull(post.publishedAt) }}</time>
          <span class="meta-sep">·</span>
          <span>约 {{ minutes }} 分钟阅读</span>
          <span class="meta-sep">·</span>
          <span>{{ site.name }}</span>
        </div>

        <div class="head-divider" />
      </section>

      <!-- ===== 正文 ===== -->
      <article class="article-body">
        <ContentRenderer :value="rendered" class="article-content" />
      </article>

      <!-- ===== 文章底部 ===== -->
      <section class="article-foot">
        <div class="foot-divider" />

        <div class="foot-tags">
          <span class="foot-label font-serif-warm">标签：</span>
          <span v-for="tag in post.tags" :key="tag" class="tag-chip font-serif-warm">
            {{ tag }}
          </span>
        </div>

        <div class="foot-share">
          <span class="foot-label font-serif-warm">分享：</span>
          <a :href="shareUrl" target="_blank" rel="noopener" class="share-link font-serif-warm">
            分享到 Twitter
          </a>
          <button class="share-link font-serif-warm" @click="copyLink">
            {{ copied ? '已复制 ✓' : '复制链接' }}
          </button>
        </div>
      </section>

      <!-- ===== 上下篇导航 ===== -->
      <section class="article-nav">
        <div class="foot-divider" />
        <div class="nav-wrap">
          <NuxtLink v-if="prevPost" :to="'/blog/' + prevPost.slug" class="nav-item prev">
            <div class="nav-label font-serif-warm">上一篇</div>
            <div class="nav-title-wrap">
              <span class="nav-arrow">&larr;</span>
              <span class="nav-title font-serif-warm">{{ prevPost.title }}</span>
            </div>
          </NuxtLink>
          <span v-else />

          <NuxtLink v-if="nextPost" :to="'/blog/' + nextPost.slug" class="nav-item next">
            <div class="nav-label font-serif-warm">下一篇</div>
            <div class="nav-title-wrap right">
              <span class="nav-title font-serif-warm">{{ nextPost.title }}</span>
              <span class="nav-arrow">&rarr;</span>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>

    <!-- ===== 右侧目录侧边栏（可折叠） ===== -->
    <aside v-if="toc.length" class="article-toc" :class="{ collapsed: tocCollapsed }">
      <button
        type="button"
        class="toc-toggle"
        :aria-expanded="String(!tocCollapsed)"
        :title="tocCollapsed ? '展开目录' : '收起目录'"
        @click="tocCollapsed = !tocCollapsed"
      >
        <span class="toc-toggle-text">目录</span>
        <span class="toc-chevron">{{ tocCollapsed ? '‹' : '»' }}</span>
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
  </main>

  <!-- ===== 移动端目录：悬浮按钮 + 侧滑抽屉 ===== -->
  <button
    v-if="toc.length"
    type="button"
    class="toc-fab font-serif-warm"
    aria-label="打开目录"
    @click="tocDrawerOpen = true"
  >
    目录
  </button>

  <Transition name="mask-fade">
    <div v-if="tocDrawerOpen" class="toc-drawer-mask" @click="tocDrawerOpen = false">
      <Transition name="drawer-slide" appear>
        <div class="toc-drawer" @click.stop>
          <div class="toc-drawer-head">
            <span class="toc-drawer-title font-serif-warm">目录</span>
            <button type="button" class="toc-drawer-close" aria-label="关闭目录" @click="tocDrawerOpen = false">×</button>
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
</template>

<style scoped>
.article-shell {
  max-width: var(--blog-content-wide);
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}
.article-shell.with-toc {
  grid-template-columns: minmax(0, 1fr) 240px;
}
.article-shell.with-toc.toc-collapsed {
  grid-template-columns: minmax(0, 1fr) 48px;
}
.article-col {
  min-width: 0;
}
.article-toc {
  position: sticky;
  top: 88px;
  align-self: start;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  transition: max-width 0.25s ease;
}

.article-head,
.article-body,
.article-foot,
.article-nav {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}

/* ===== 头部 ===== */
.article-head {
  padding-top: 56px;
  padding-bottom: 40px;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
  margin-bottom: 32px;
  transition: color 0.2s ease;
}
.back-link:hover {
  color: var(--blog-primary);
}
.head-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.head-tag {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--blog-primary);
}
.tag-sep {
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}
.head-title {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--blog-foreground);
}
@media (min-width: 640px) {
  .head-title {
    font-size: 2.25rem;
  }
}
@media (min-width: 768px) {
  .head-title {
    font-size: 3rem;
  }
}
.head-meta {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}
.meta-sep {
  color: var(--blog-border);
}
.head-divider {
  margin-top: 32px;
  height: 1px;
  width: 100%;
  background: var(--blog-border);
}

/* ===== 正文 ===== */
.article-body {
  padding-bottom: 48px;
}
/* 标题锚点滚动偏移（避免被顶部遮挡） */
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  scroll-margin-top: 88px;
}
/* 引言段首字下沉（杂志式） */
.article-body :deep(.article-content > p:first-of-type)::first-letter {
  float: left;
  font-family: var(--blog-font-serif);
  font-size: 3.8rem;
  line-height: 0.9;
  padding-right: 0.5rem;
  padding-top: 0.35rem;
  color: var(--blog-primary);
  font-weight: 600;
}

/* ===== 目录侧边栏 ===== */
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

/* ===== 底部 ===== */
.article-foot {
  padding-bottom: 40px;
}
.foot-divider {
  height: 1px;
  width: 100%;
  background: var(--blog-border);
  margin-bottom: 32px;
}
.foot-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.foot-label {
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}
.tag-chip {
  font-size: 0.875rem;
  color: var(--blog-foreground);
  border: 1px solid var(--blog-border);
  background: var(--blog-card);
  padding: 4px 10px;
  border-radius: var(--blog-radius-sm);
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.tag-chip:hover {
  color: var(--blog-primary);
  border-color: color-mix(in srgb, var(--blog-primary) 40%, transparent);
}
.foot-share {
  display: flex;
  align-items: center;
  gap: 20px;
}
.share-link {
  font-size: 0.875rem;
  color: var(--blog-foreground);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-underline-offset: 2px;
  transition: color 0.2s ease;
}
.share-link:hover {
  color: var(--blog-primary);
  text-decoration: underline;
}

/* ===== 上下篇 ===== */
.article-nav {
  padding-bottom: 64px;
}
.nav-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@media (min-width: 640px) {
  .nav-wrap {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
.nav-item {
  max-width: 48%;
}
.nav-item.next {
  text-align: right;
  margin-left: auto;
}
@media (max-width: 639px) {
  .nav-item {
    max-width: 100%;
  }
}
.nav-label {
  font-size: 0.75rem;
  color: var(--blog-muted-foreground);
  margin-bottom: 6px;
}
.nav-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.nav-title-wrap.right {
  justify-content: flex-end;
}
.nav-arrow {
  color: var(--blog-primary);
  margin-top: 2px;
  flex-shrink: 0;
}
.nav-title {
  font-size: 0.875rem;
  line-height: 1.375;
  color: var(--blog-foreground);
  transition: color 0.2s ease;
}
.nav-item:hover .nav-title {
  color: var(--blog-primary);
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
  .article-shell,
  .article-shell.with-toc {
    grid-template-columns: minmax(0, 1fr);
  }
  .article-toc {
    display: none;
  }
  .toc-fab {
    display: inline-flex;
  }
}
</style>
