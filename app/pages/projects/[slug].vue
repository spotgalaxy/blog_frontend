<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

interface Project {
  slug: string
  name: string
  role: string
  year: number | null
  summary: string
  content: string
  cover: string | null
  coverDark: string | null
  letter: string | null
  link: string | null
}

const { data: project } = await useAsyncData(`project-${slug}`, () =>
  $fetch<{ code: number; message: string; data: Project }>(`/api/projects/${slug}`)
    .then((r) => r.data)
    .catch(() => null)
)

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: '作品不存在' })
}

const { data: rendered } = await useAsyncData(`render-proj-${slug}`, () =>
  parseMarkdown(project.value!.content)
)

useHead({
  title: `${project.value.name} · 作品集 · spotgalaxy`,
  meta: [{ name: 'description', content: project.value.summary }]
})
</script>

<template>
  <main v-if="project">
    <!-- 头部 -->
    <section class="proj-head">
      <NuxtLink to="/projects" class="back-link font-serif-warm">
        <span>&larr;</span> 返回作品集
      </NuxtLink>

      <p class="proj-meta">{{ project.role }} · {{ project.year }}</p>
      <h1 class="proj-title font-serif-warm">{{ project.name }}</h1>
      <p class="proj-summary">{{ project.summary }}</p>

      <a
        v-if="project.link"
        :href="project.link"
        target="_blank"
        rel="noopener"
        class="proj-extlink font-serif-warm"
      >
        访问项目 <span>&rarr;</span>
      </a>
    </section>

    <!-- 封面（内部展示：详情页优先用 coverDark，仅填外部色时回退） -->
    <section v-if="project.cover || project.coverDark" class="proj-cover-wrap">
      <div class="proj-cover" :style="coverStyle(project.coverDark || project.cover)">
        <span class="cover-letter font-serif-warm">{{ project.letter }}</span>
      </div>
    </section>

    <!-- 正文 -->
    <article class="proj-body">
      <ContentRenderer :value="rendered" class="article-content" />
    </article>

    <!-- 底部导航 -->
    <section class="proj-foot">
      <div class="foot-divider" />
      <NuxtLink to="/projects" class="back-link font-serif-warm">
        <span>&larr;</span> 返回作品集
      </NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.proj-head,
.proj-body,
.proj-foot {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}

.proj-head {
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
.proj-meta {
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--blog-primary);
  margin-bottom: 12px;
}
.proj-title {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--blog-foreground);
  margin-bottom: 16px;
}
@media (min-width: 768px) {
  .proj-title {
    font-size: 3rem;
  }
}
.proj-summary {
  color: var(--blog-muted-foreground);
  line-height: 1.625;
  margin-bottom: 24px;
}
.proj-extlink {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--blog-primary);
  transition: gap 0.2s ease;
}
.proj-extlink:hover {
  gap: 8px;
}

.proj-cover-wrap {
  max-width: var(--blog-content-wide);
  margin: 0 auto;
  padding: 0 24px 48px;
}
.proj-cover {
  width: 100%;
  aspect-ratio: 21 / 9;
  border-radius: var(--blog-radius-sm);
  position: relative;
  overflow: hidden;
}
.cover-letter {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.35);
}

.proj-body {
  padding-bottom: 48px;
}

.proj-foot {
  padding-bottom: 64px;
}
.foot-divider {
  height: 1px;
  width: 100%;
  background: var(--blog-border);
  margin-bottom: 32px;
}
</style>
