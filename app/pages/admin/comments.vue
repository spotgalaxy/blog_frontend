<script setup lang="ts">
useHead({ title: '评论审核 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()

interface CommentRow {
  id: number
  postSlug: string
  author: string
  content: string
  status: string
  createdAt: string
}

const status = ref('pending')
const page = ref(1)
const pageSize = 20

const { data, refresh } = await useAsyncData('admin-comments', () =>
  apiFetch<{ code: number; message: string; data: { records: CommentRow[]; total: number } }>(
    `/api/admin/comments?status=${status.value}&page=${page.value}&pageSize=${pageSize}`
  ).then((r) => r.data)
)

const switchTab = (s: string) => {
  status.value = s
  page.value = 1
  refresh()
}

const review = async (c: CommentRow, to: 'approved' | 'rejected') => {
  await apiFetch(`/api/admin/comments/${c.id}`, { method: 'PUT', body: { status: to } })
  refresh()
}
const remove = async (c: CommentRow) => {
  if (!confirm('确定删除该评论？')) return
  await apiFetch(`/api/admin/comments/${c.id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <main class="admin-wrap">
    <AdminNav />
    <div class="admin-head">
      <h1 class="admin-title font-serif-warm">评论审核</h1>
      <div class="tabs">
        <button class="tab" :class="{ active: status === 'pending' }" @click="switchTab('pending')">待审核</button>
        <button class="tab" :class="{ active: status === 'approved' }" @click="switchTab('approved')">已通过</button>
        <button class="tab" :class="{ active: status === 'rejected' }" @click="switchTab('rejected')">已拒绝</button>
      </div>
    </div>

    <ul class="admin-list">
      <li v-for="c in data?.records ?? []" :key="c.id" class="admin-row comment-row">
        <div>
          <div class="c-head">
            <span class="c-author">{{ c.author }}</span>
            <span class="c-meta">{{ c.postSlug }} · {{ formatDateFull(c.createdAt) }}</span>
          </div>
          <p class="c-content">{{ c.content }}</p>
        </div>
        <div class="row-actions">
          <template v-if="c.status === 'pending'">
            <button class="admin-link" @click="review(c, 'approved')">通过</button>
            <button class="admin-link danger" @click="review(c, 'rejected')">拒绝</button>
          </template>
          <button class="admin-link danger" @click="remove(c)">删除</button>
        </div>
      </li>
    </ul>
    <p v-if="(data?.records ?? []).length === 0" class="empty">暂无评论</p>
  </main>
</template>

<style scoped>
.admin-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
.admin-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.admin-title { font-size: 1.75rem; color: var(--blog-foreground); }
.tabs { display: flex; gap: 8px; }
.tab {
  padding: 6px 14px; border: 1px solid var(--blog-border); border-radius: 999px;
  background: var(--blog-card); color: var(--blog-muted-foreground);
  font-size: 0.8rem; cursor: pointer;
}
.tab.active { background: var(--blog-primary); color: #fff; border-color: transparent; }
.admin-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.admin-row {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding: 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-md); background: var(--blog-card);
}
.c-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; gap: 12px; }
.c-author { font-weight: 500; color: var(--blog-foreground); font-size: 0.95rem; }
.c-meta { font-size: 0.75rem; color: var(--blog-muted-foreground); }
.c-content { color: var(--blog-foreground); font-size: 0.9rem; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap; }
.row-actions { display: flex; gap: 12px; flex-shrink: 0; }
.admin-link { background: none; border: none; font-size: 0.875rem; cursor: pointer; color: var(--blog-primary); }
.admin-link.danger { color: var(--blog-muted-foreground); }
.empty { text-align: center; color: var(--blog-muted-foreground); padding: 48px 0; }
</style>
