<script setup lang="ts">
useHead({ title: '编辑作品 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { apiFetch } = useApi()
const editId = ref<number | null>(route.query.id ? Number(route.query.id) : null)

interface Project {
  id: number
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
  sortOrder: number
}

const form = reactive({
  slug: '', name: '', role: '', devStart: '', devEnd: '',
  summary: '', content: '', cover: '', coverDark: '', letter: 'P',
  link: '', featured: false, sortOrder: 99
})

// 封面展示类型：纯色 / 图片。值本身自描述（颜色或地址），渲染端按值自动区分
const coverType = ref<'color' | 'image'>('color')
const coverDarkType = ref<'color' | 'image'>('color')

if (editId.value) {
  const { data: list } = await apiFetch<{ code: number; message: string; data: Project[] }>('/api/projects')
  const p = list.find((x) => x.id === editId.value)
  if (p) {
    Object.assign(form, {
      slug: p.slug, name: p.name, role: p.role ?? '',
      devStart: p.devStart ?? '', devEnd: p.devEnd ?? '',
      summary: p.summary ?? '', content: p.content ?? '', cover: p.cover ?? '',
      coverDark: p.coverDark ?? '', letter: p.letter ?? 'P', link: p.link ?? '',
      featured: p.featured, sortOrder: p.sortOrder
    })
    coverType.value = (!form.cover || isColorValue(form.cover)) ? 'color' : 'image'
    coverDarkType.value = (!form.coverDark || isColorValue(form.coverDark)) ? 'color' : 'image'
  }
}

// 切换类型时清掉不匹配的旧值（颜色 ↔ 图片地址）
watch(coverType, (t) => {
  if (form.cover && isColorValue(form.cover) !== (t === 'color')) form.cover = ''
})
watch(coverDarkType, (t) => {
  if (form.coverDark && isColorValue(form.coverDark) !== (t === 'color')) form.coverDark = ''
})

const saving = ref(false)
const msg = ref('')

const save = async () => {
  if (saving.value) return
  saving.value = true
  msg.value = ''
  const payload = {
    slug: form.slug, name: form.name, role: form.role,
    devStart: form.devStart || null, devEnd: form.devEnd || null,
    summary: form.summary, content: form.content, cover: form.cover || null,
    coverDark: form.coverDark || null, letter: form.letter, link: form.link || null,
    featured: form.featured, sortOrder: form.sortOrder
  }
  try {
    if (editId.value) {
      await apiFetch(`/api/projects/${editId.value}`, { method: 'PUT', body: payload })
      msg.value = '已保存'
    } else {
      const { data } = await apiFetch<{ code: number; message: string; data: { id: number } }>(
        '/api/projects', { method: 'POST', body: payload }
      )
      editId.value = data.id
      msg.value = '已保存，可继续生成 AI 介绍'
      // 跳到编辑态（拿 id），后续保存走 PUT；组件若因路由变化重建也会按 id 重新加载
      await navigateTo(`/admin/projects/edit?id=${data.id}`, { replace: true })
    }
  } catch (e: any) {
    msg.value = e?.data?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

/* ===== AI 介绍 ===== */
const introMsg = ref('')
const generating = ref(false)

const genIntro = async () => {
  if (!editId.value) {
    introMsg.value = '请先保存作品再生成'
    return
  }
  generating.value = true
  introMsg.value = ''
  try {
    const { data } = await apiFetch<{ code: number; message: string; data: { summary: string } }>(
      '/api/ai/project-intro',
      { method: 'POST', body: { projectId: editId.value } }
    )
    form.summary = data.summary
    introMsg.value = '已生成，记得保存'
  } catch (e: any) {
    introMsg.value = e?.data?.message || '生成失败'
  } finally {
    generating.value = false
  }
}

/* ===== 正文预览 ===== */
const preview = ref<any>(null)
const showPreview = ref(false)
watch(
  [showPreview, () => form.content],
  async ([show]) => {
    if (show) preview.value = await parseMarkdown(form.content)
  }
)
</script>

<template>
  <main class="edit-wrap">
    <AdminNav />
    <div class="edit-head">
      <NuxtLink to="/admin/projects" class="back-link">&larr; 返回列表</NuxtLink>
      <h1 class="edit-title font-serif-warm">{{ editId ? '编辑作品' : '新建作品' }}</h1>
      <div class="edit-actions">
        <button class="admin-btn primary" @click="save" :disabled="saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>
    <p v-if="msg" class="edit-msg">{{ msg }}</p>

    <div class="edit-fields">
      <div class="field">
        <label class="field-label">项目名（作品的显示名称）</label>
        <input v-model="form.name" class="edit-input big" placeholder="项目名" required />
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
          <label class="field-label">开发开始（年-月，如 2024-03）</label>
          <input v-model="form.devStart" type="month" class="edit-input" />
        </div>
        <div class="field">
          <label class="field-label">开发结束（年-月，进行中可留空）</label>
          <input v-model="form.devEnd" type="month" class="edit-input" />
        </div>
        <div class="field">
          <label class="field-label">排序（数字越小越靠前，默认 99）</label>
          <input v-model.number="form.sortOrder" type="number" class="edit-input" placeholder="排序（小在前）" />
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">外部展示封面（作品列表 / 首页精选卡片）</label>
          <div class="cover-type">
            <label class="type-opt"><input v-model="coverType" type="radio" value="color" /> 纯色</label>
            <label class="type-opt"><input v-model="coverType" type="radio" value="image" /> 图片</label>
          </div>
          <input
            v-model="form.cover"
            class="edit-input"
            :placeholder="coverType === 'color' ? '展示颜色，如 #b45309' : '展示图片地址，https://…'"
          />
        </div>
        <div class="field">
          <label class="field-label">内部展示封面（作品详情页顶部）</label>
          <div class="cover-type">
            <label class="type-opt"><input v-model="coverDarkType" type="radio" value="color" /> 纯色</label>
            <label class="type-opt"><input v-model="coverDarkType" type="radio" value="image" /> 图片</label>
          </div>
          <input
            v-model="form.coverDark"
            class="edit-input"
            :placeholder="coverDarkType === 'color' ? '详情页颜色，如 #b45309' : '详情页图片地址，https://…'"
          />
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
          <span class="edit-msg inline">{{ introMsg }}</span>
        </div>
      </div>
    </div>

    <div class="editor-toolbar">
      <button class="admin-btn small" @click="showPreview = !showPreview">
        {{ showPreview ? '编辑' : '预览' }}
      </button>
    </div>

    <div v-if="!showPreview" class="field">
      <label class="field-label">正文（作品详情页内容，支持 Markdown：## 标题、- 列表、**加粗**、`代码` 等）</label>
      <textarea v-model="form.content" class="edit-input editor" placeholder="正文（Markdown）" />
    </div>
    <article v-else class="preview-box article-content">
      <ContentRenderer v-if="preview" :value="preview" />
    </article>

    <label class="check-row">
      <input v-model="form.featured" type="checkbox" />
      首页精选
    </label>
  </main>
</template>

<style scoped>
.edit-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 96px; }
.edit-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.back-link { font-size: 0.875rem; color: var(--blog-muted-foreground); text-decoration: none; }
.back-link:hover { color: var(--blog-primary); }
.edit-title { font-size: 1.75rem; color: var(--blog-foreground); flex: 1; }
.edit-actions { display: flex; gap: 12px; }
.admin-btn {
  padding: 8px 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-sm);
  background: var(--blog-card); color: var(--blog-foreground); font-size: 0.875rem; cursor: pointer;
}
.admin-btn.primary { background: var(--blog-primary); color: #fff; border-color: transparent; }
.admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.admin-btn.small { padding: 4px 12px; font-size: 0.8rem; }
.edit-msg { margin-bottom: 16px; font-size: 0.875rem; color: var(--blog-primary); }
.edit-msg.inline { margin-bottom: 0; }
.edit-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.field-row { display: flex; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.field-label { font-size: 0.75rem; color: var(--blog-muted-foreground); }
.edit-input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-sm); background: var(--blog-card);
  color: var(--blog-foreground); font-size: 0.95rem; box-sizing: border-box;
}
.edit-input.big { font-size: 1.25rem; }
.editor-toolbar { margin-bottom: 8px; }
.editor { min-height: 240px; font-family: var(--blog-font-mono); line-height: 1.7; resize: vertical; }
.preview-box { border: 1px solid var(--blog-border); border-radius: var(--blog-radius-md); padding: 24px; margin-bottom: 16px; }
.edit-summary { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
.cover-type { display: flex; gap: 16px; }
.type-opt {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; color: var(--blog-muted-foreground); cursor: pointer;
}
.type-opt input { accent-color: var(--blog-primary); margin: 0; }
.check-row { display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 0.875rem; color: var(--blog-foreground); }
</style>
