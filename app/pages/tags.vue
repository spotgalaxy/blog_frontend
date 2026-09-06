<script setup lang="ts">
useHead({
  title: '标签 · spotgalaxy',
  link: [{ rel: 'canonical', href: `${(useRuntimeConfig().public.siteUrl as string).replace(/\/$/, '')}/tags` }]
})

interface TagStat {
  name: string
  count: number
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

/** 标签聚合计数直接来自后端 SQL 聚合接口 */
const { data: tags } = await useAsyncData('tag-stats', async () => {
  const res = await $fetch<ApiEnvelope<TagStat[]>>('/api/posts/tags')
  return (res.data ?? []).sort((a, b) => b.count - a.count)
})

/** 标签字号随数量轻微变化（1.0 ~ 1.6 倍） */
const fontScale = (count: number) => {
  const max = Math.max(...(tags.value ?? []).map((t) => t.count), 1)
  return 1 + (Math.log(count + 1) / Math.log(max + 1)) * 0.6
}
</script>

<template>
  <div>
    <header class="page-head">
      <img src="/svg/spotgalaxy-v15-sidebar.svg" alt="spotgalaxy" class="brand-mark" />
      <p class="head-kicker font-serif-warm">话题 · 线索</p>
      <h1 class="head-title font-serif-warm">标签</h1>
      <p class="head-sub">共 {{ tags?.length ?? 0 }} 个标签 · 点击进入对应文章列表</p>
      <div class="head-divider" />
    </header>

    <main class="tag-cloud">
      <NuxtLink
        v-for="t in tags ?? []"
        :key="t.name"
        :to="{ path: '/blog', query: { tag: t.name } }"
        class="tag-pill font-serif-warm"
        :style="{ fontSize: fontScale(t.count) + 'rem' }"
      >
        {{ t.name }}
        <span class="tag-count">{{ t.count }}</span>
      </NuxtLink>
      <p v-if="tags && !tags.length" class="head-sub">还没有标签</p>
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

/* ===== 标签云 ===== */
.tag-cloud {
  max-width: 36rem;
  margin: 0 auto;
  padding: 24px 24px 64px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}
.tag-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--blog-border);
  border-radius: 999px;
  background: var(--blog-card);
  color: var(--blog-foreground);
  text-decoration: none;
  line-height: 1.4;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.tag-pill:hover {
  color: var(--blog-primary);
  border-color: color-mix(in srgb, var(--blog-primary) 40%, transparent);
}
.tag-count {
  font-size: 0.75rem;
  color: var(--blog-muted-foreground);
}
</style>
