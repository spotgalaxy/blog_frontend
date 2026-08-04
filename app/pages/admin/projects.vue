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
  summary: string
  content: string
  cover: string | null
  coverDark: string | null
  letter: string | null
  link: string | null
  featured: boolean
  sortOrder: number
}

const { data: projects, refresh } = await useAsyncData('admin-projects', () =>
  apiFetch<{ code: number; message: string; data: Project[] }>('/api/projects').then((r) => r.data)
)

const editingId = ref<number | null>(null)
const showForm = ref(false)
const form = reactive({
  slug: '', name: '', role: '', year: null as number | null,
  summary: '', content: '', cover: '', coverDark: '', letter: 'P',
  link: '', featured: false, sortOrder: 99
})

const openCreate = () => {
  editingId.value = null
  Object.assign(form, {
    slug: '', name: '', role: '', year: null, summary: '', content: '',
    cover: '', coverDark: '', letter: 'P', link: '', featured: false, sortOrder: 99
  })
  showForm.value = true
}

const openEdit = (p: Project) => {
  editingId.value = p.id
  Object.assign(form, {
    slug: p.slug, name: p.name, role: p.role ?? '', year: p.year,
    summary: p.summary ?? '', content: p.content ?? '', cover: p.cover ?? '',
    coverDark: p.coverDark ?? '', letter: p.letter ?? 'P', link: p.link ?? '',
    featured: p.featured, sortOrder: p.sortOrder
  })
  showForm.value = true
}

const save = async () => {
  const payload = {
    slug: form.slug, name: form.name, role: form.role, year: form.year,
    summary: form.summary, content: form.content, cover: form.cover || null,
    coverDark: form.coverDark || null, letter: form.letter, link: form.link || null,
    featured: form.featured, sortOrder: form.sortOrder
  }
  if (editingId.value) {
    await apiFetch(`/api/projects/${editingId.value}`, { method: 'PUT', body: payload })
  } else {
    await apiFetch('/api/projects', { method: 'POST', body: payload })
  }
  showForm.value = false
  refresh()
}

const remove = async (p: Project) => {
  if (!confirm(`确定删除「${p.name}」？`)) return
  await apiFetch(`/api/projects/${p.id}`, { method: 'DELETE' })
  refresh()
}
</script>

<template>
  <main class="admin-wrap">
    <div class="admin-head">
      <h1 class="admin-title font-serif-warm">作品管理</h1>
      <button class="admin-btn primary" @click="openCreate">新建作品</button>
    </div>

    <ul class="admin-list">
      <li v-for="p in projects ?? []" :key="p.id" class="admin-row">
        <div>
          <span class="row-title">{{ p.name }}</span>
          <div class="row-meta">
            <span>{{ p.role }} · {{ p.year ?? '—' }}</span>
            <span v-if="p.featured" class="badge pub">精选</span>
            <span>{{ p.slug }}</span>
          </div>
        </div>
        <div class="row-actions">
          <button class="admin-link" @click="openEdit(p)">编辑</button>
          <button class="admin-link danger" @click="remove(p)">删除</button>
        </div>
      </li>
    </ul>

    <form v-if="showForm" class="proj-form" @submit.prevent="save">
      <h2 class="form-title font-serif-warm">{{ editingId ? '编辑作品' : '新建作品' }}</h2>
      <input v-model="form.name" class="edit-input" placeholder="项目名" required />
      <div class="field-row">
        <input v-model="form.slug" class="edit-input" placeholder="slug" required />
        <input v-model="form.role" class="edit-input" placeholder="角色（如 前端开发）" />
      </div>
      <div class="field-row">
        <input v-model.number="form.year" type="number" class="edit-input" placeholder="年份" />
        <input v-model.number="form.sortOrder" type="number" class="edit-input" placeholder="排序（小在前）" />
      </div>
      <div class="field-row">
        <input v-model="form.cover" class="edit-input" placeholder="封面颜色（如 #b45309）" />
        <input v-model="form.coverDark" class="edit-input" placeholder="暗色封面颜色" />
      </div>
      <div class="field-row">
        <input v-model="form.letter" class="edit-input" placeholder="字母（默认 P）" />
        <input v-model="form.link" class="edit-input" placeholder="外链（可选）" />
      </div>
      <textarea v-model="form.summary" class="edit-input" placeholder="一句话介绍" rows="2" />
      <textarea v-model="form.content" class="edit-input editor" placeholder="正文（Markdown）" />
      <label class="check-row">
        <input v-model="form.featured" type="checkbox" />
        首页精选
      </label>
      <div class="form-actions">
        <button type="submit" class="admin-btn primary">保存</button>
        <button type="button" class="admin-btn" @click="showForm = false">取消</button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.admin-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
.admin-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
.admin-title { font-size: 1.75rem; color: var(--blog-foreground); }
.admin-btn {
  padding: 8px 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-sm);
  background: var(--blog-card); color: var(--blog-foreground); font-size: 0.875rem; cursor: pointer;
}
.admin-btn.primary { background: var(--blog-primary); color: #fff; border-color: transparent; }
.admin-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.admin-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-md); background: var(--blog-card);
}
.row-title { font-size: 1rem; color: var(--blog-foreground); }
.row-meta { display: flex; gap: 12px; align-items: center; margin-top: 6px; font-size: 0.75rem; color: var(--blog-muted-foreground); }
.badge { padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; background: var(--blog-primary); color: #fff; }
.row-actions { display: flex; gap: 12px; }
.admin-link { background: none; border: none; font-size: 0.875rem; color: var(--blog-primary); cursor: pointer; }
.admin-link.danger { color: var(--blog-muted-foreground); }
.proj-form {
  margin-top: 32px; padding: 24px; border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-md); background: var(--blog-card);
  display: flex; flex-direction: column; gap: 12px;
}
.form-title { font-size: 1.25rem; color: var(--blog-foreground); }
.edit-input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-sm); background: var(--blog-card);
  color: var(--blog-foreground); font-size: 0.95rem; box-sizing: border-box;
}
.field-row { display: flex; gap: 12px; }
.editor { min-height: 240px; font-family: var(--blog-font-mono); line-height: 1.7; resize: vertical; }
.check-row { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--blog-foreground); }
.form-actions { display: flex; gap: 12px; }
</style>
