<script setup lang="ts">
useHead({
  title: '归档 · spotgalaxy',
  link: [{ rel: 'canonical', href: `${(useRuntimeConfig().public.siteUrl as string).replace(/\/$/, '')}/archive` }]
})

interface Post {
  slug: string
  title: string
  publishedAt: string | null
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const { data: posts } = await useAsyncData('archive-list', async () => {
  const res = await $fetch<ApiEnvelope<Post[]>>('/api/posts')
  return res.data
})

/** 按年分组，年内按日期倒序（接口本身已按 publishedAt 倒序） */
const yearGroups = computed(() => {
  const groups = new Map<number, Post[]>()
  for (const p of posts.value ?? []) {
    if (!p.publishedAt) continue
    const year = new Date(p.publishedAt).getFullYear()
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(p)
  }
  return [...groups.entries()].sort((a, b) => b[0] - a[0])
})

const total = computed(() => (posts.value ?? []).length)
</script>

<template>
  <div>
    <header class="page-head">
      <img src="/svg/spotgalaxy-v15-sidebar.svg" alt="spotgalaxy" class="brand-mark" />
      <p class="head-kicker font-serif-warm">时光 · 足迹</p>
      <h1 class="head-title font-serif-warm">归档</h1>
      <p class="head-sub">共写下 {{ total }} 篇文章 · 按年份回溯</p>
      <div class="head-divider" />
    </header>

    <main class="archive-body">
      <p v-if="!yearGroups.length && !posts" class="head-sub">加载中…</p>
      <p v-else-if="!yearGroups.length" class="head-sub">还没有发布的文章</p>

      <section v-for="[year, items] in yearGroups" :key="year" class="year-group">
        <h2 class="year-title font-serif-warm">
          <span class="year-num">{{ formatYearCn(year) }}</span>
          <span class="year-suffix font-serif-warm">年</span>
          <span class="year-count">{{ items.length }} 篇</span>
        </h2>
        <ul class="post-lines">
          <li v-for="p in items" :key="p.slug" class="post-line">
            <NuxtLink :to="'/blog/' + p.slug" class="line-link">
              <time class="line-date font-serif-warm">{{ formatDateCn(p.publishedAt!) }}</time>
              <span class="line-title font-serif-warm">{{ p.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ===== 页头（与博客页同款） ===== */
.page-head {
  max-width: 36rem;
  margin: 0 auto;
  padding: 48px 24px 40px;
  text-align: center;
}
.brand-mark {
  display: block;
  width: 120px;
  height: auto;
  margin-bottom: 32px;
}
.head-kicker {
  font-size: 0.875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--blog-muted-foreground);
  margin-bottom: 16px;
}
.head-title {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--blog-foreground);
  margin-bottom: 24px;
}
.head-sub {
  color: var(--blog-muted-foreground);
  font-size: 1rem;
  line-height: 1.625;
  margin-bottom: 32px;
}
.head-divider {
  width: 64px;
  height: 1px;
  background: var(--blog-border);
  margin: 0 auto;
}

/* ===== 时间线 ===== */
.archive-body {
  max-width: 36rem;
  margin: 0 auto;
  padding: 32px 24px 64px;
}
.year-group {
  margin-bottom: 48px;
}
.year-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 20px;
}
.year-num {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--blog-primary);
}
.year-suffix {
  font-size: 1rem;
  color: var(--blog-muted-foreground);
}
.year-count {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--blog-muted-foreground);
}
.post-lines {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.post-line {
  border-bottom: 1px solid var(--blog-border);
}
.post-line:last-child {
  border-bottom: none;
}
.line-link {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 12px 0;
  text-decoration: none;
}
.line-date {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--blog-muted-foreground);
  min-width: 5.5em;
}
.line-title {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--blog-foreground);
  transition: color 0.2s ease;
}
.line-link:hover .line-title {
  color: var(--blog-primary);
}
</style>
