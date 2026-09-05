<script setup lang="ts">
useHead({ title: '博客 · spotgalaxy' })

interface Post {
  slug: string
  title: string
  summary: string
  content: string
  tags: string[]
  cover: string | null
  publishedAt: string | null
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const { data: posts } = await useAsyncData('blog-list', async () => {
  const res = await $fetch<ApiEnvelope<Post[]>>('/api/posts')
  return res.data
})

const allTags = computed(() => {
  const set = new Set<string>()
  posts.value?.forEach((p) => p.tags?.forEach((t) => set.add(t)))
  return ['全部', ...set]
})

const activeTag = ref('全部')
const page = ref(1)
const pageSize = 8

const filtered = computed(() =>
  activeTag.value === '全部'
    ? (posts.value ?? [])
    : (posts.value ?? []).filter((p) => p.tags?.includes(activeTag.value))
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize))
)

const paged = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize)
)

watch(activeTag, () => {
  page.value = 1
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = page.value
  const items: (number | '...')[] = []
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - cur) <= 1) items.push(i)
    else if (items[items.length - 1] !== '...') items.push('...')
  }
  return items
})

const minutes = (post: Post) => readingTime(post.content ?? '')
</script>

<template>
  <div>
    <!-- 页头区 -->
    <header class="page-head">
      <img src="/svg/spotgalaxy-v15-sidebar.svg" alt="spotgalaxy" class="brand-mark" />
      <p class="head-kicker font-serif-warm">随笔 · 记录</p>
      <h1 class="head-title font-serif-warm">博客</h1>
      <p class="head-sub">
        关于技术、设计与生活的思考 · 共 {{ filtered.length }} 篇
      </p>
      <div class="head-divider" />
    </header>

    <!-- 标签筛选 -->
    <section class="tag-filter">
      <button
        v-for="tag in allTags"
        :key="tag"
        class="tag-item"
        :class="{ active: activeTag === tag }"
        @click="activeTag = tag"
      >
        {{ tag }}
      </button>
    </section>

    <!-- 文章列表 -->
    <main class="post-list">
      <article v-for="(post, i) in paged" :key="post.slug" v-reveal="{ delay: i * 60 }" class="post">
        <NuxtLink :to="'/blog/' + post.slug" class="post-link">
          <div class="post-text">
            <time class="post-date font-serif-warm">{{ formatDateFull(post.publishedAt) }}</time>
            <h2 class="post-title font-serif-warm">{{ post.title }}</h2>
            <p class="post-summary">{{ post.summary }}</p>
            <div class="post-meta">
              <span>约 {{ minutes(post) }} 分钟阅读</span>
              <template v-for="tag in post.tags" :key="tag">
                <span class="sep">·</span>
                <span class="post-tag">{{ tag }}</span>
              </template>
            </div>
          </div>
          <PostCover :cover="post.cover" :alt="post.title" direction="right" class="post-cover" />
        </NuxtLink>
      </article>
    </main>

    <!-- 分页 -->
    <nav v-if="totalPages > 1" class="pagination" aria-label="分页导航">
      <button
        class="page-btn"
        :disabled="page === 1"
        @click="page--"
      >
        <span>&larr;</span> 上一页
      </button>
      <div class="page-nums">
        <template v-for="(n, i) in pageNumbers" :key="i">
          <span v-if="n === '...'" class="dots">...</span>
          <button
            v-else
            class="page-num"
            :class="{ active: n === page }"
            @click="page = n"
          >
            {{ n }}
          </button>
        </template>
      </div>
      <button
        class="page-btn"
        :disabled="page === totalPages"
        @click="page++"
      >
        下一页 <span>&rarr;</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
/* ===== 页头 ===== */
.page-head {
  max-width: 36rem;
  margin: 0 auto;
  padding: 48px 24px 40px;
  text-align: center;
}
/* 左上角品牌标 */
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
@media (min-width: 768px) {
  .head-title {
    font-size: 3.75rem;
  }
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

/* ===== 标签筛选 ===== */
.tag-filter {
  max-width: 36rem;
  margin: 0 auto;
  padding: 24px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}
.tag-item {
  background: none;
  border: none;
  padding: 6px 2px;
  font-size: 0.875rem;
  font-family: var(--blog-font-sans);
  color: var(--blog-muted-foreground);
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: color 0.2s ease;
}
.tag-item:hover {
  color: var(--blog-foreground);
}
.tag-item.active {
  color: var(--blog-primary);
  font-weight: 500;
  border-bottom-color: var(--blog-primary);
}

/* ===== 文章列表 ===== */
.post-list {
  max-width: 36rem;
  margin: 0 auto;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  gap: 64px;
}
.post-link {
  display: flex;
  align-items: center;
  gap: 24px;
}
.post-text {
  flex: 1;
  min-width: 0;
}
/* 有封面时:右侧 4:3 封面,左缘模糊融入文字区 */
.post-cover {
  width: 38%;
  aspect-ratio: 4 / 3;
  border-radius: var(--blog-radius-md);
  flex-shrink: 0;
}
.post-date {
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}
.post-title {
  margin-top: 8px;
  margin-bottom: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.375;
  color: var(--blog-foreground);
  transition: color 0.2s ease;
}
.post-link:hover .post-title {
  color: var(--blog-primary);
}
@media (min-width: 768px) {
  .post-title {
    font-size: 1.875rem;
  }
}
.post-summary {
  color: var(--blog-muted-foreground);
  font-size: 1rem;
  line-height: 1.625;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--blog-muted-foreground);
}
.sep {
  color: var(--blog-border);
}
.post-tag {
  color: var(--blog-primary);
}

/* ===== 分页 ===== */
.pagination {
  max-width: 36rem;
  margin: 0 auto;
  padding: 32px 24px 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 0.875rem;
}
.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-family: var(--blog-font-sans);
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
  cursor: pointer;
  transition: color 0.2s ease;
}
.page-btn:hover:not(:disabled) {
  color: var(--blog-foreground);
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-nums {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 16px;
}
.page-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-bottom: 1px solid transparent;
  font-family: var(--blog-font-sans);
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
  cursor: pointer;
  transition: color 0.2s ease;
}
.page-num:hover {
  color: var(--blog-foreground);
}
.page-num.active {
  color: var(--blog-primary);
  font-weight: 500;
  border-bottom-color: var(--blog-primary);
}
.dots {
  color: var(--blog-muted-foreground);
}
</style>
