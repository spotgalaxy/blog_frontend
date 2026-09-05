<script setup lang="ts">
useHead({ title: '作品管理 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()

interface Project {
  id: number
  slug: string
  name: string
  role: string
  year: number | null
  featured: boolean
}

const { data: projects, refresh } = await useAsyncData('admin-projects', () =>
  apiFetch<{ code: number; message: string; data: Project[] }>('/api/projects').then((r) => r.data)
)

const confirmDelete = async (p: Project) => {
  if (!confirm(`确定删除「${p.name}」？`)) return
  await apiFetch(`/api/projects/${p.id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <main class="admin-wrap">
    <AdminNav />
    <div class="admin-head">
      <h1 class="admin-title font-serif-warm">作品管理</h1>
      <NuxtLink to="/admin/projects/edit" class="admin-btn primary">新建作品</NuxtLink>
    </div>
    <ul class="admin-list">
      <li v-for="p in projects ?? []" :key="p.id" class="admin-row">
        <div>
          <NuxtLink :to="`/admin/projects/edit?id=${p.id}`" class="row-title">{{ p.name }}</NuxtLink>
          <div class="row-meta">
            <span>{{ p.role }} · {{ p.year ?? '—' }}</span>
            <span v-if="p.featured" class="badge pub">精选</span>
            <span>{{ p.slug }}</span>
          </div>
        </div>
        <div class="row-actions">
          <NuxtLink :to="`/projects/${p.slug}`" class="admin-link" target="_blank">查看</NuxtLink>
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
.badge.pub { background: var(--blog-primary); color: #fff; }
.row-actions { display: flex; gap: 12px; }
.admin-link { background: none; border: none; font-size: 0.875rem; color: var(--blog-primary); cursor: pointer; text-decoration: none; }
.admin-link.danger { color: var(--blog-muted-foreground); }
</style>
