<script setup lang="ts">
useHead({ title: '文章管理 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()

interface Post {
  id: number
  slug: string
  title: string
  draft: boolean
  publishedAt: string | null
  updatedAt: string
}

const { data: posts, refresh } = await useAsyncData('admin-posts', () =>
  apiFetch<{ code: number; message: string; data: Post[] }>('/api/posts?draft=true').then((r) => r.data)
)
const confirmDelete = async (p: Post) => {
  if (!confirm(`确定删除「${p.title}」？评论将一并删除。`)) return
  await apiFetch(`/api/posts/${p.id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <main class="admin-wrap">
    <AdminNav />
    <div class="admin-head">
      <h1 class="admin-title font-serif-warm">文章管理</h1>
      <NuxtLink to="/admin/posts/edit" class="admin-btn primary">新建文章</NuxtLink>
    </div>
    <ul class="admin-list">
      <li v-for="p in posts ?? []" :key="p.id" class="admin-row">
        <div>
          <NuxtLink :to="`/admin/posts/edit?id=${p.id}`" class="row-title">{{ p.title }}</NuxtLink>
          <div class="row-meta">
            <span :class="['badge', p.draft ? 'draft' : 'pub']">{{ p.draft ? '草稿' : '已发布' }}</span>
            <span>{{ p.slug }}</span>
          </div>
        </div>
        <div class="row-actions">
          <NuxtLink :to="`/blog/${p.slug}`" class="admin-link" target="_blank">查看</NuxtLink>
          <button class="admin-link danger" @click="confirmDelete(p)">删除</button>
        </div>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.admin-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
.admin-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.admin-title { font-size: 1.75rem; color: var(--blog-foreground); }
.admin-btn {
  padding: 8px 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-sm);
  background: var(--blog-card); color: var(--blog-foreground); font-size: 0.875rem; cursor: pointer;
  text-decoration: none;
}
.admin-btn.primary { background: var(--blog-primary); color: #fff; border-color: transparent; }
.admin-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.admin-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-md); background: var(--blog-card);
}
.row-title { font-size: 1rem; color: var(--blog-foreground); text-decoration: none; }
.row-title:hover { color: var(--blog-primary); }
.row-meta { display: flex; gap: 12px; align-items: center; margin-top: 6px; font-size: 0.75rem; color: var(--blog-muted-foreground); }
.badge { padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; }
.badge.draft { background: var(--blog-muted-foreground); color: #fff; }
.badge.pub { background: var(--blog-primary); color: #fff; }
.row-actions { display: flex; gap: 12px; }
.admin-link { background: none; border: none; font-size: 0.875rem; color: var(--blog-primary); cursor: pointer; text-decoration: none; }
.admin-link.danger { color: var(--blog-muted-foreground); }
</style>
