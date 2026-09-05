<script setup lang="ts">
const route = useRoute()

const links = [
  { to: '/admin/posts', label: '文章管理', match: (p: string) => p.startsWith('/admin/posts') },
  { to: '/admin/projects', label: '作品管理', match: (p: string) => p.startsWith('/admin/projects') },
  { to: '/admin/comments', label: '评论审核', match: (p: string) => p.startsWith('/admin/comments') },
  { to: '/admin/stats', label: '统计看板', match: (p: string) => p.startsWith('/admin/stats') }
]
</script>

<template>
  <nav class="admin-nav">
    <NuxtLink
      v-for="l in links"
      :key="l.to"
      :to="l.to"
      class="nav-item"
      :class="{ active: l.match(route.path) }"
    >
      {{ l.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.admin-nav { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
.nav-item {
  padding: 6px 14px; border: 1px solid var(--blog-border); border-radius: 999px;
  background: var(--blog-card); color: var(--blog-muted-foreground);
  font-size: 0.8rem; text-decoration: none;
}
.nav-item:hover { color: var(--blog-primary); }
.nav-item.active { background: var(--blog-primary); color: #fff; border-color: transparent; }
</style>
