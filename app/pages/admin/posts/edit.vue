<script setup lang="ts">
useHead({ title: '编辑文章 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { apiFetch } = useApi()
const editId = route.query.id as string | undefined

const form = reactive({
  slug: '',
  title: '',
  summary: '',
  content: '',
  tagsText: '',
  cover: '',
  draft: true
})

// 封面展示类型：图片 / 纯色。值本身自描述（颜色或地址），渲染端按值自动区分
const coverType = ref<'color' | 'image'>('image')

if (editId) {
  // apiFetch 返回完整 envelope {code,message,data}，解构 data 即拿到数组
  const { data: list } = await apiFetch<{ code: number; message: string; data: Array<{ id: number; slug: string }> }>('/api/posts?draft=true')
  const found = list.find((p) => p.id === Number(editId))
  if (found) {
    const { data: post } = await apiFetch<{ code: number; message: string; data: {
      id: number; slug: string; title: string; summary: string; content: string;
      tags: string[]; cover: string | null; draft: boolean
    } }>(`/api/posts/${found.slug}`)
    form.slug = post.slug
    form.title = post.title
    form.summary = post.summary ?? ''
    form.content = post.content ?? ''
    form.tagsText = (post.tags ?? []).join(',')
    form.cover = post.cover ?? ''
    form.draft = post.draft
    coverType.value = isColorValue(form.cover) ? 'color' : 'image'
  }
}

// 切换类型时清掉不匹配的旧值（图片地址 ↔ 颜色）
watch(coverType, (t) => {
  if (form.cover && isColorValue(form.cover) !== (t === 'color')) form.cover = ''
})

const tagsList = computed(() =>
  form.tagsText.split(',').map((s) => s.trim()).filter(Boolean)
)

const saving = ref(false)
const msg = ref('')

const save = async (draft: boolean) => {
  saving.value = true
  msg.value = ''
  const payload = {
    slug: form.slug,
    title: form.title,
    summary: form.summary,
    content: form.content,
    tags: tagsList.value,
    cover: form.cover || null,
    draft
  }
  try {
    if (editId) {
      await apiFetch(`/api/posts/${editId}`, { method: 'PUT', body: payload })
    } else {
      const { data } = await apiFetch<{ code: number; message: string; data: { id: number } }>('/api/posts', { method: 'POST', body: payload })
      if (!draft) {
        await apiFetch(`/api/posts/${data.id}/publish`, { method: 'POST', body: { published: !draft } })
      }
      // 新建后跳到编辑态（拿 id），后续保存/发布走 PUT
      const { data: list } = await apiFetch<{ code: number; message: string; data: Array<{ id: number; slug: string }> }>('/api/posts?draft=true')
      const created = list.find((p) => p.slug === payload.slug)
      if (created) await navigateTo(`/admin/posts/edit?id=${created.id}`, { replace: true })
    }
    msg.value = draft ? '已保存草稿' : '已发布'
  } catch (e: any) {
    msg.value = e?.data?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

const preview = ref<any>(null)
const showPreview = ref(false)
watch(
  [showPreview, () => form.content],
  async ([show]) => {
    if (show) preview.value = await parseArticleMarkdown(form.content)
  }
)

/* ===== AI 摘要 ===== */
const summaryMsg = ref('')
const generating = ref(false)
const genSummary = async () => {
  if (!editId) {
    summaryMsg.value = '请先保存文章再生成摘要'
    return
  }
  generating.value = true
  summaryMsg.value = ''
  try {
    const { data } = await apiFetch<{ code: number; message: string; data: { summary: string } }>(
      '/api/ai/summary',
      { method: 'POST', body: { postId: Number(editId) } }
    )
    form.summary = data.summary
    summaryMsg.value = '已生成并填入摘要'
  } catch (e: any) {
    summaryMsg.value = e?.data?.message || '生成失败'
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <main class="edit-wrap">
    <AdminNav />
    <div class="edit-head">
      <NuxtLink to="/admin/posts" class="back-link">&larr; 返回列表</NuxtLink>
      <h1 class="edit-title font-serif-warm">{{ editId ? '编辑文章' : '新建文章' }}</h1>
      <div class="edit-actions">
        <button class="admin-btn" @click="save(true)" :disabled="saving">保存草稿</button>
        <button class="admin-btn primary" @click="save(false)" :disabled="saving">发布</button>
      </div>
    </div>
    <p v-if="msg" class="edit-msg">{{ msg }}</p>

    <div class="edit-fields">
      <div class="field">
        <label class="field-label">标题（文章标题）</label>
        <input v-model="form.title" class="edit-input big" placeholder="标题" />
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">slug（URL 路径，英文/数字/短横线，如 my-first-post）</label>
          <input v-model="form.slug" class="edit-input" placeholder="slug（URL 标识，如 my-first-post）" />
        </div>
        <div class="field">
          <label class="field-label">封面（可选，选图片填地址，选纯色填颜色值）</label>
          <div class="cover-type">
            <label class="type-opt"><input v-model="coverType" type="radio" value="image" /> 图片</label>
            <label class="type-opt"><input v-model="coverType" type="radio" value="color" /> 纯色</label>
          </div>
          <input
            v-model="form.cover"
            class="edit-input"
            :placeholder="coverType === 'color' ? '封面颜色，如 #b45309' : '封面图片地址，https://…'"
          />
        </div>
      </div>
      <div class="field">
        <label class="field-label">标签（多个用英文逗号分隔，如 前端,随笔）</label>
        <input v-model="form.tagsText" class="edit-input" placeholder="标签，逗号分隔（如 前端,随笔）" />
      </div>
      <div class="field">
        <label class="field-label">摘要（展示在文章列表卡片上的一两句话）</label>
        <textarea v-model="form.summary" class="edit-input" placeholder="摘要" rows="2" />
        <div class="edit-summary">
          <button class="admin-btn small" :disabled="generating" @click="genSummary">
            {{ generating ? '生成中…' : '生成 AI 摘要' }}
          </button>
          <span class="edit-msg">{{ summaryMsg }}</span>
        </div>
      </div>
    </div>

    <div class="editor-toolbar">
      <button class="admin-btn small" @click="showPreview = !showPreview">
        {{ showPreview ? '编辑' : '预览' }}
      </button>
    </div>

    <div v-if="!showPreview" class="field">
      <label class="field-label">正文（文章内容，支持 Markdown：## 标题、- 列表、**加粗**、`代码` 等）</label>
      <textarea
        v-model="form.content"
        class="edit-input editor"
        placeholder="正文（Markdown）"
      />
    </div>
    <article v-else class="preview-box article-content">
      <ContentRenderer v-if="preview" :value="preview" />
    </article>
  </main>
</template>

<style scoped>
.edit-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px 96px; }
.edit-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.back-link { font-size: 0.875rem; color: var(--blog-muted-foreground); text-decoration: none; }
.edit-title { font-size: 1.75rem; color: var(--blog-foreground); flex: 1; }
.edit-actions { display: flex; gap: 12px; }
.admin-btn {
  padding: 8px 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-sm);
  background: var(--blog-card); color: var(--blog-foreground); font-size: 0.875rem; cursor: pointer;
}
.admin-btn.primary { background: var(--blog-primary); color: #fff; border-color: transparent; }
.admin-btn.small { padding: 4px 12px; font-size: 0.8rem; }
.edit-msg { margin-bottom: 16px; font-size: 0.875rem; color: var(--blog-primary); }
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
.editor { min-height: 420px; font-family: var(--blog-font-mono); line-height: 1.7; resize: vertical; }
.preview-box { border: 1px solid var(--blog-border); border-radius: var(--blog-radius-md); padding: 24px; }
.edit-summary { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.cover-type { display: flex; gap: 16px; }
.type-opt {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; color: var(--blog-muted-foreground); cursor: pointer;
}
.type-opt input { accent-color: var(--blog-primary); margin: 0; }
</style>
