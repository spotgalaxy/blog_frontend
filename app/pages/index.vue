<script setup lang="ts">
useHead({ title: 'spotgalaxy · 个人博客' })

interface Project {
  slug: string
  name: string
  role: string
  devStart: string | null
  devEnd: string | null
  summary: string
  content: string
  cover: string | null
  coverDark: string | null
  letter: string | null
  link: string | null
  featured: boolean
}

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

const { data: featuredProjects } = await useAsyncData('home-projects', () =>
  $fetch<ApiEnvelope<Project[]>>('/api/projects').then((r) => r.data.filter((p) => p.featured))
)

const { data: latestPosts } = await useAsyncData('home-posts', () =>
  $fetch<ApiEnvelope<Post[]>>('/api/posts').then((r) => r.data.slice(0, 5))
)

const todayCn = formatDateCnFull(new Date())

const layoutOf = (i: number) => ['left', 'right', 'full'][i % 3]

// 封面文字黑白自适应:按封面颜色深浅切换黑字/白字
const { toneClass } = useCoverTones(() =>
  featuredProjects.value?.map((p) => p.cover || p.coverDark)
)
</script>

<template>
  <main>
    <!-- ===== Hero — 窄栏杂志式 ===== -->
    <section class="hero">
      <div class="hero-date">
        <span class="date-label">{{ todayCn }}</span>
      </div>

      <DecoLine class="hero-deco" />

      <h1 class="hero-title font-serif-warm">你好，我是{{ site.name }}</h1>

      <div class="hero-intro">
        <p class="drop-cap">
          写作者、后端开发者。在代码与文字之间游走，相信好的设计和真挚的文字一样，都应当优雅而高效。
          这一年学习中学到了许多。也大抵算是浅浅入了个门，后续还是要加强学习，更加深入学习各种知识，
          更好的提升自己。
        </p>
        <p>
          这个博客是我精神世界的一隅自留地。这里没有热点，没有喧嚣，
          只有一些关于技术、设计、阅读与生活的缓慢思考。
          如果你也喜欢在安静的地方读一些安静的文字，欢迎你留在这里。
        </p>
      </div>

      <div class="hero-signature">
        <p class="signature">—— {{ site.name }}</p>
      </div>
    </section>

    <!-- ===== 精选作品 — 杂志式布局 ===== -->
    <section class="works">
      <div v-reveal class="works-head">
        <SectionTitle title="精选作品" />
      </div>

      <template v-for="(project, i) in featuredProjects" :key="project.slug">
        <!-- 全宽布局 -->
        <article v-if="layoutOf(i) === 'full'" v-reveal class="work work-full">
          <NuxtLink
            :to="'/projects/' + project.slug"
            class="work-cover cover-wide"
            :class="toneClass(project.cover || project.coverDark)"
            :style="coverStyle(project.cover || project.coverDark)"
          >
            <span class="cover-text font-serif-warm">{{ project.name }}</span>
          </NuxtLink>
          <div class="work-full-body">
            <p class="work-meta">{{ project.role }} · {{ formatDevPeriod(project.devStart, project.devEnd) }}</p>
            <h3 class="work-title font-serif-warm">{{ project.name }}</h3>
            <p class="work-summary">{{ project.summary }}</p>
            <NuxtLink :to="'/projects/' + project.slug" class="work-link font-serif-warm">
              阅读更多 <span>&rarr;</span>
            </NuxtLink>
          </div>
        </article>

        <!-- 左图右文 / 左文右图 -->
        <article v-else v-reveal class="work work-split">
          <NuxtLink
            :to="'/projects/' + project.slug"
            class="work-cover cover-normal"
            :class="[{ 'order-right': layoutOf(i) === 'right' }, toneClass(project.cover || project.coverDark)]"
            :style="coverStyle(project.cover || project.coverDark)"
          >
            <span class="cover-text font-serif-warm">{{ project.name }}</span>
          </NuxtLink>
          <div class="work-body" :class="{ 'order-left': layoutOf(i) === 'right' }">
            <p class="work-meta">{{ project.role }} · {{ formatDevPeriod(project.devStart, project.devEnd) }}</p>
            <h3 class="work-title font-serif-warm">{{ project.name }}</h3>
            <p class="work-summary">{{ project.summary }}</p>
            <NuxtLink :to="'/projects/' + project.slug" class="work-link font-serif-warm">
              阅读更多 <span>&rarr;</span>
            </NuxtLink>
          </div>
        </article>
      </template>
    </section>

    <!-- ===== 最新文章 — 文字列表 ===== -->
    <section class="posts">
      <div v-reveal class="posts-head">
        <SectionTitle title="最新文章" />
        <NuxtLink to="/blog" class="view-all font-serif-warm">查看全部 &rarr;</NuxtLink>
      </div>

      <div class="post-list">
        <NuxtLink
          v-for="(post, i) in latestPosts"
          :key="post.slug"
          v-reveal="{ delay: i * 70 }"
          :to="'/blog/' + post.slug"
          class="post-item"
        >
          <div class="post-item-text">
            <div class="post-meta">
              <time class="tabular">{{ formatDateCn(post.publishedAt) }}</time>
              <span v-if="post.tags?.length" class="post-cat">
                · {{ post.tags.slice(0, 2).join(' 与 ') }}
              </span>
            </div>
            <h3 class="post-title font-serif-warm">{{ post.title }}</h3>
            <p class="post-summary">{{ post.summary }}</p>
          </div>
          <PostCover :cover="post.cover" :alt="post.title" direction="right" class="home-post-cover" />
        </NuxtLink>
      </div>
    </section>

    <!-- ===== 结语 ===== -->
    <section v-reveal class="closing">
      <DecoLine short />
      <p class="closing-text font-serif-warm">愿文字有力量。</p>
      <DecoLine short />
    </section>
  </main>
</template>

<style scoped>
/* ===== Hero 入场动画 ===== */
@keyframes hero-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.hero > * {
  animation: hero-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.hero > *:nth-child(2) {
  animation-delay: 0.08s;
}
.hero > *:nth-child(3) {
  animation-delay: 0.16s;
}
.hero > *:nth-child(4) {
  animation-delay: 0.26s;
}
.hero > *:nth-child(5) {
  animation-delay: 0.36s;
}

/* ===== Hero ===== */
.hero {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  padding: 48px 24px 64px;
}
@media (min-width: 768px) {
  .hero {
    padding: 64px 24px 80px;
  }
}

.hero-date {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}
.date-label {
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--blog-muted-foreground);
}

.hero-deco {
  margin-bottom: 40px;
}

.hero-title {
  text-align: center;
  font-size: 2.25rem;
  font-weight: 500;
  line-height: 1.25;
  color: var(--blog-foreground);
}
@media (min-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }
}
@media (min-width: 1024px) {
  .hero-title {
    font-size: 3.75rem;
  }
}

.hero-intro {
  margin-top: 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-size: 15px;
  line-height: 2;
  color: color-mix(in srgb, var(--blog-foreground) 80%, transparent);
}
@media (min-width: 768px) {
  .hero-intro {
    font-size: 1rem;
  }
}

.hero-signature {
  margin-top: 48px;
  text-align: right;
}
.hero-signature .signature {
  font-size: 1.125rem;
  color: color-mix(in srgb, var(--blog-primary) 70%, transparent);
}

/* ===== 精选作品 ===== */
.works {
  max-width: var(--blog-content-wide);
  margin: 0 auto;
  padding: 64px 24px;
}
@media (min-width: 768px) {
  .works {
    padding: 96px 24px;
  }
}

.works-head {
  text-align: center;
  margin-bottom: 56px;
}

.work {
  margin-bottom: 80px;
}
.work:last-child {
  margin-bottom: 0;
}

.work-split {
  display: grid;
  gap: 40px;
  align-items: center;
}
@media (min-width: 768px) {
  .work-split {
    grid-template-columns: 3fr 2fr;
    gap: 48px;
  }
  .work-split .order-right {
    order: 2;
  }
  .work-split .order-left {
    order: 1;
  }
}

.work-cover {
  position: relative;
  display: block;
  width: 100%;
  overflow: hidden;
  border-radius: var(--blog-radius-sm);
  transition:
    transform 0.4s ease,
    box-shadow 0.4s ease;
}
.work-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.14) 0%,
    transparent 40%,
    rgba(0, 0, 0, 0.22) 100%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.work-cover:hover {
  transform: scale(1.015);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
}
.work-cover:hover::after {
  opacity: 1;
}
.cover-normal {
  aspect-ratio: 4 / 3;
}
.cover-wide {
  aspect-ratio: 21 / 9;
  margin-bottom: 24px;
}
.cover-text {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.6);
  transition:
    color 0.3s ease,
    letter-spacing 0.4s ease;
}
.work-cover:hover .cover-text {
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.08em;
}
.cover-wide .cover-text {
  font-size: 1.25rem;
}
/* 浅色封面 → 黑字,hover 遮罩改为白色提亮 */
.work-cover.tone-light .cover-text {
  color: rgba(0, 0, 0, 0.6);
}
.work-cover.tone-light:hover .cover-text {
  color: rgba(0, 0, 0, 0.95);
}
.cover-wide.tone-light .cover-text {
  color: rgba(0, 0, 0, 0.5);
}
.work-cover.tone-light::after {
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.14) 0%,
    transparent 40%,
    rgba(255, 255, 255, 0.28) 100%
  );
}

.work-full-body {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  text-align: center;
}

.work-meta {
  margin-bottom: 12px;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--blog-primary);
}

.work-title {
  margin-bottom: 16px;
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.375;
  color: var(--blog-foreground);
}
@media (min-width: 768px) {
  .work-title {
    font-size: 1.875rem;
  }
}

.work-summary {
  margin-bottom: 24px;
  font-size: 0.875rem;
  line-height: 1.75;
  color: var(--blog-muted-foreground);
}

.work-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--blog-primary);
  transition: gap 0.2s ease;
}
.work-link:hover {
  gap: 8px;
}

/* ===== 最新文章 ===== */
.posts {
  max-width: 720px;
  margin: 0 auto;
  padding: 64px 24px;
}
@media (min-width: 768px) {
  .posts {
    padding: 96px 24px;
  }
}

.posts-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 48px;
}

.view-all {
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
  transition: color 0.2s ease;
}
.view-all:hover {
  color: var(--blog-primary);
}

.post-item {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 0 -12px;
  padding: 32px 12px;
  border-bottom: 1px dotted var(--blog-border);
  border-radius: var(--blog-radius-md);
  transition: background-color 0.2s ease;
}
.post-item:last-child {
  border-bottom: none;
}
.post-item:hover {
  background: color-mix(in srgb, var(--blog-muted) 30%, transparent);
}
.post-item-text {
  flex: 1;
  min-width: 0;
}
/* 右侧封面:与博客列表同款左文右图,左缘模糊融入文字区 */
.home-post-cover {
  width: 132px;
  aspect-ratio: 4 / 3;
  border-radius: var(--blog-radius-md);
  flex-shrink: 0;
}
@media (max-width: 639px) {
  .home-post-cover {
    width: 96px;
  }
}

.post-meta {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 8px;
}
.post-meta time {
  font-size: 0.75rem;
  color: var(--blog-muted-foreground);
  white-space: nowrap;
}
.post-cat {
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--blog-primary) 60%, transparent);
}

.post-title {
  margin-bottom: 8px;
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.375;
  color: var(--blog-foreground);
  transition: color 0.2s ease;
}
.post-item:hover .post-title {
  color: var(--blog-primary);
}
@media (min-width: 768px) {
  .post-title {
    font-size: 1.25rem;
  }
}

.post-summary {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--blog-muted-foreground);
}

/* ===== 结语 ===== */
.closing {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  padding: 80px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
@media (min-width: 768px) {
  .closing {
    padding: 112px 24px;
  }
}
.closing-text {
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.625;
  color: var(--blog-foreground);
  text-align: center;
}
@media (min-width: 768px) {
  .closing-text {
    font-size: 1.875rem;
  }
}
</style>
