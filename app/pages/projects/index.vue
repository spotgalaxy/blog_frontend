<script setup lang="ts">
useHead({ title: '作品集 · spotgalaxy' })

interface Project {
  slug: string
  name: string
  role: string
  year: number | null
  summary: string
  cover: string | null
  coverDark: string | null
  letter: string | null
  link: string | null
}

const { data: projects } = await useAsyncData('projects-list', () =>
  $fetch<{ code: number; message: string; data: Project[] }>('/api/projects').then((r) => r.data)
)

const categories = ['全部', '后端端开发', '数据库设计', '全栈']
const activeCat = ref('全部')

const filtered = computed(() =>
  activeCat.value === '全部'
    ? (projects.value ?? [])
    : (projects.value ?? []).filter((p) => p.role.includes(activeCat.value))
)

/** 杂志式布局循环：左图右文 → 左文右图 → 全宽 → 双列×2 → 居中文字 */
const PATTERN = ['split', 'split-rev', 'full', 'half', 'half', 'center'] as const

type Block =
  | { type: 'split' | 'split-rev' | 'full' | 'center'; item: any; num: string }
  | { type: 'halves'; items: { item: any; num: string }[] }

const blocks = computed<Block[]>(() => {
  const list = filtered.value
  const result: Block[] = []
  let halves: { item: any; num: string }[] = []
  const flush = () => {
    if (halves.length) {
      result.push({ type: 'halves', items: halves })
      halves = []
    }
  }
  list.forEach((p, i) => {
    const layout = PATTERN[i % PATTERN.length]!
    const num = String(i + 1).padStart(2, '0')
    if (layout === 'half') {
      halves.push({ item: p, num })
    } else {
      flush()
      result.push({ type: layout, item: p, num })
    }
  })
  flush()
  return result
})
</script>

<template>
  <div>
    <!-- 页头区 -->
    <section class="page-head">
      <div class="head-inner">
        <p class="head-kicker">精选项目</p>
        <h1 class="head-title font-serif-warm">作品集</h1>
        <p class="head-sub">
          过去参与和独立完成的一些项目，涵盖后端端开发、数据库与全栈实践。
        </p>
        <div class="deco-line head-deco" />
      </div>
    </section>

    <!-- 分类 -->
    <section class="cat-filter">
      <button
        v-for="cat in categories"
        :key="cat"
        class="category-item"
        :class="{ active: activeCat === cat }"
        @click="activeCat = cat"
      >
        {{ cat }}
      </button>
    </section>

    <!-- 作品展示 -->
    <section class="works">
      <div class="works-inner">
        <template v-for="(block, bi) in blocks" :key="bi">
          <!-- 双列小图 -->
          <div v-if="block.type === 'halves'" class="grid-half">
            <article v-for="h in block.items" :key="h.item.slug">
              <NuxtLink :to="'/projects/' + h.item.slug" class="cover cover-half" :style="{ background: h.item.cover }">
                <span class="cover-letter font-serif-warm">{{ h.item.letter }}</span>
              </NuxtLink>
              <span class="project-num half-num">{{ h.num }}</span>
              <h3 class="half-title font-serif-warm">{{ h.item.name }}</h3>
              <p class="work-meta">{{ h.item.role }} · {{ h.item.year }}</p>
              <p class="half-summary">{{ h.item.summary }}</p>
              <NuxtLink :to="'/projects/' + h.item.slug" class="project-link">
                查看详情 <span class="link-arrow">&rarr;</span>
              </NuxtLink>
            </article>
          </div>

          <!-- 居中文字式 -->
          <article v-else-if="block.type === 'center'" class="work-center">
            <div class="center-inner">
              <span class="project-num center-num">{{ block.num }}</span>
              <h2 class="work-title font-serif-warm">{{ block.item.name }}</h2>
              <p class="work-meta">{{ block.item.role }} · {{ block.item.year }}</p>
              <p class="work-summary">{{ block.item.summary }}</p>
              <NuxtLink :to="'/projects/' + block.item.slug" class="project-link">
                查看详情 <span class="link-arrow">&rarr;</span>
              </NuxtLink>
            </div>
          </article>

          <!-- 全宽大图 -->
          <article v-else-if="block.type === 'full'" class="work-full">
            <NuxtLink :to="'/projects/' + block.item.slug" class="cover cover-full" :style="{ background: block.item.cover }">
              <span class="cover-letter big font-serif-warm">{{ block.item.letter }}</span>
            </NuxtLink>
            <div class="full-body">
              <span class="project-num center-num">{{ block.num }}</span>
              <h2 class="work-title font-serif-warm">{{ block.item.name }}</h2>
              <p class="work-meta">{{ block.item.role }} · {{ block.item.year }}</p>
              <p class="work-summary">{{ block.item.summary }}</p>
              <NuxtLink :to="'/projects/' + block.item.slug" class="project-link">
                查看详情 <span class="link-arrow">&rarr;</span>
              </NuxtLink>
            </div>
          </article>

          <!-- 左右交错 -->
          <article v-else class="work-split" :class="{ rev: block.type === 'split-rev' }">
            <NuxtLink :to="'/projects/' + block.item.slug" class="cover cover-split" :style="{ background: block.item.cover }">
              <span class="cover-letter font-serif-warm">{{ block.item.letter }}</span>
            </NuxtLink>
            <div class="split-body">
              <span class="project-num split-num">{{ block.num }}</span>
              <h2 class="work-title font-serif-warm">{{ block.item.name }}</h2>
              <p class="work-meta">{{ block.item.role }} · {{ block.item.year }}</p>
              <p class="work-summary">{{ block.item.summary }}</p>
              <NuxtLink :to="'/projects/' + block.item.slug" class="project-link">
                查看详情 <span class="link-arrow">&rarr;</span>
              </NuxtLink>
            </div>
          </article>
        </template>
      </div>
    </section>

    <!-- 合作 CTA -->
    <section class="cta">
      <div class="cta-inner">
        <h2 class="cta-title font-serif-warm">想合作？</h2>
        <p class="cta-text">
          如果你有有趣的项目想法，或者只是想聊聊设计与代码，欢迎随时联系我。
        </p>
        <a :href="`mailto:${site.email}`" class="project-link">
          联系我 <span class="link-arrow">&rarr;</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ===== 页头 ===== */
.page-head {
  padding: 80px 24px 64px;
}
@media (min-width: 768px) {
  .page-head {
    padding: 112px 24px 80px;
  }
}
.head-inner {
  max-width: 42rem;
  margin: 0 auto;
  text-align: center;
}
.head-kicker {
  font-size: 0.875rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--blog-primary);
  margin-bottom: 24px;
}
.head-title {
  font-size: 3rem;
  line-height: 1.2;
  color: var(--blog-foreground);
  margin-bottom: 32px;
  text-wrap: balance;
}
@media (min-width: 768px) {
  .head-title {
    font-size: 3.75rem;
  }
}
@media (min-width: 1024px) {
  .head-title {
    font-size: 4.5rem;
  }
}
.head-sub {
  color: var(--blog-muted-foreground);
  font-size: 1rem;
  line-height: 1.625;
  margin-bottom: 40px;
}
.head-deco {
  margin: 0 auto;
}

/* ===== 分类 ===== */
.cat-filter {
  padding: 0 24px 64px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px 40px;
}
.category-item {
  position: relative;
  background: none;
  border: none;
  padding: 0 0 2px;
  font-family: var(--blog-font-sans);
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
  cursor: pointer;
  transition: color 0.2s ease;
}
.category-item:hover {
  color: var(--blog-foreground);
}
.category-item.active {
  color: var(--blog-primary);
}
.category-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: var(--blog-primary);
}

/* ===== 作品区 ===== */
.works {
  padding: 0 24px 96px;
}
.works-inner {
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 128px;
}

.cover {
  display: block;
  width: 100%;
  border-radius: var(--blog-radius-sm);
  overflow: hidden;
  position: relative;
  transition: transform 0.4s ease;
}
.cover:hover {
  transform: scale(1.01);
}
.cover-letter {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.4);
}
.cover-letter.big {
  font-size: 8rem;
}
@media (min-width: 768px) {
  .cover-letter {
    font-size: 8rem;
  }
  .cover-letter.big {
    font-size: 9rem;
  }
}

.work-meta {
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
  letter-spacing: 0.05em;
  margin-bottom: 24px;
}
.work-title {
  font-size: 1.875rem;
  line-height: 1.25;
  color: var(--blog-foreground);
  margin-bottom: 16px;
}
@media (min-width: 768px) {
  .work-title {
    font-size: 2.25rem;
  }
}
.work-summary {
  color: var(--blog-muted-foreground);
  line-height: 1.625;
  margin-bottom: 32px;
}

.project-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--blog-primary);
}
.link-arrow {
  display: inline-block;
  transition: transform 0.25s ease;
}
.project-link:hover .link-arrow {
  transform: translateX(4px);
}

/* 左右交错 */
.work-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  align-items: center;
}
@media (min-width: 1024px) {
  .work-split {
    grid-template-columns: repeat(12, 1fr);
    gap: 64px;
  }
  .work-split .cover-split {
    grid-column: span 7;
  }
  .work-split .split-body {
    grid-column: span 5;
    padding-left: 16px;
  }
  .work-split.rev .cover-split {
    order: 2;
  }
  .work-split.rev .split-body {
    order: 1;
    padding-left: 0;
    padding-right: 16px;
  }
}
.cover-split {
  aspect-ratio: 4 / 3;
}
.split-num {
  display: block;
  margin-bottom: 20px;
}

/* 全宽 */
.work-full {
  text-align: center;
}
.cover-full {
  aspect-ratio: 16 / 9;
  margin-bottom: 48px;
}
.full-body {
  max-width: 42rem;
  margin: 0 auto;
}
.center-num {
  display: block;
  margin-bottom: 20px;
}

/* 双列 */
.grid-half {
  display: grid;
  grid-template-columns: 1fr;
  gap: 48px;
}
@media (min-width: 768px) {
  .grid-half {
    grid-template-columns: 1fr 1fr;
    gap: 64px;
  }
}
.cover-half {
  aspect-ratio: 4 / 3;
  margin-bottom: 32px;
}
.half-num {
  display: block;
  margin-bottom: 16px;
}
.half-title {
  font-size: 1.5rem;
  line-height: 1.25;
  color: var(--blog-foreground);
  margin-bottom: 12px;
}
@media (min-width: 768px) {
  .half-title {
    font-size: 1.875rem;
  }
}
.half-summary {
  color: var(--blog-muted-foreground);
  font-size: 0.875rem;
  line-height: 1.625;
  margin-bottom: 24px;
}
@media (min-width: 768px) {
  .half-summary {
    font-size: 1rem;
  }
}

/* 居中文字式 */
.work-center {
  text-align: center;
  padding: 64px 0;
  border-top: 1px solid color-mix(in srgb, var(--blog-border) 60%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--blog-border) 60%, transparent);
}
.center-inner {
  max-width: 42rem;
  margin: 0 auto;
}

/* ===== CTA ===== */
.cta {
  padding: 96px 24px;
  border-top: 1px solid color-mix(in srgb, var(--blog-border) 60%, transparent);
}
.cta-inner {
  max-width: 42rem;
  margin: 0 auto;
  text-align: center;
}
.cta-title {
  font-size: 1.875rem;
  color: var(--blog-foreground);
  margin-bottom: 24px;
}
@media (min-width: 768px) {
  .cta-title {
    font-size: 2.25rem;
  }
}
.cta-text {
  color: var(--blog-muted-foreground);
  line-height: 1.625;
  margin-bottom: 40px;
}
</style>
