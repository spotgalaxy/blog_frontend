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
    showForm.value = false
  } else {
    // 新建后保持表单为编辑态，便于继续点"生成 AI 介绍"
    const { data } = await apiFetch<{ code: number; message: string; data: { id: number } }>(
      '/api/projects', { method: 'POST', body: payload }
    )
    editingId.value = data.id
    formMsg.value = '已保存，可继续生成 AI 介绍'
  }
  refresh()
}

const formMsg = ref('')
const introMsg = ref('')
const generating = ref(false)

const genIntro = async () => {
  if (!editingId.value) {
    introMsg.value = '请先保存作品再生成'
    return
  }
  generating.value = true
  introMsg.value = ''
  try {
    const { data } = await apiFetch<{ code: number; message: string; data: { summary: string } }>(
      '/api/ai/project-intro',
      { method: 'POST', body: { projectId: editingId.value } }
    )
    form.summary = data.summary
    introMsg.value = '已生成，记得保存'
  } catch (e: any) {
    introMsg.value = e?.data?.message || '生成失败'
  } finally {
    generating.value = false
  }
}

const remove = async (p: Project) => {
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
      <div class="field">
        <label class="field-label">项目名（作品的显示名称）</label>
        <input v-model="form.name" class="edit-input" placeholder="项目名" required />
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">slug（URL 路径，英文/数字/短横线，如 my-project）</label>
          <input v-model="form.slug" class="edit-input" placeholder="slug" required />
        </div>
        <div class="field">
          <label class="field-label">角色（你在这个项目中担任的职位）</label>
          <input v-model="form.role" class="edit-input" placeholder="角色（如 前端开发）" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">年份（项目完成年份，如 2025）</label>
          <input v-model.number="form.year" type="number" class="edit-input" placeholder="年份" />
        </div>
        <div class="field">
          <label class="field-label">排序（数字越小越靠前，默认 99）</label>
          <input v-model.number="form.sortOrder" type="number" class="edit-input" placeholder="排序（小在前）" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">封面颜色（卡片背景色，填十六进制色值如 #b45309）</label>
          <input v-model="form.cover" class="edit-input" placeholder="封面颜色（如 #b45309）" />
        </div>
        <div class="field">
          <label class="field-label">暗色模式封面颜色（暗色主题下卡片的背景色）</label>
          <input v-model="form.coverDark" class="edit-input" placeholder="暗色封面颜色" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">字母（封面上的装饰大字母，默认 P）</label>
          <input v-model="form.letter" class="edit-input" placeholder="字母（默认 P）" />
        </div>
        <div class="field">
          <label class="field-label">外链（项目上线地址或 GitHub 链接，可留空）</label>
          <input v-model="form.link" class="edit-input" placeholder="外链（可选）" />
        </div>
      </div>
      <div class="field">
        <label class="field-label">一句话介绍（展示在作品卡片上）</label>
        <textarea v-model="form.summary" class="edit-input" placeholder="一句话介绍" rows="2" />
        <div class="edit-summary">
          <button type="button" class="admin-btn small" :disabled="generating" @click="genIntro">
            {{ generating ? '生成中…' : '生成 AI 介绍' }}
          </button>
          <span class="edit-msg">{{ introMsg || formMsg }}</span>
        </div>
      </div>
      <div class="field">
        <label class="field-label">正文（作品详情页内容，支持 Markdown，如 ## 标题、- 列表）</label>
        <textarea v-model="form.content" class="edit-input editor" placeholder="正文（Markdown）" />
      </div>
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
.field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.field-label { font-size: 0.75rem; color: var(--blog-muted-foreground); }
.editor { min-height: 240px; font-family: var(--blog-font-mono); line-height: 1.7; resize: vertical; }
.check-row { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--blog-foreground); }
.form-actions { display: flex; gap: 12px; }
.admin-btn.small { padding: 4px 12px; font-size: 0.8rem; align-self: flex-start; }
.edit-summary { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
.edit-msg { font-size: 0.8rem; color: var(--blog-muted-foreground); }
</style>
