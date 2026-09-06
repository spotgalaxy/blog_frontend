<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

interface Post {
  id: number
  slug: string
  title: string
  summary: string
  content: string
  tags: string[]
  cover: string | null
  publishedAt: string | null
  viewCount?: number
}

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

const { data: post } = await useAsyncData(`blog-${slug}`, async () => {
  try {
    const res = await $fetch<ApiEnvelope<Post>>(`/api/posts/${slug}`)
    return res.data
  } catch {
    return null
  }
})

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在' })
}

const { data: nav } = await useAsyncData(`blog-nav-${slug}`, async () => {
  try {
    const res = await $fetch<ApiEnvelope<{ prev: NavPost | null; next: NavPost | null }>>(
      `/api/posts/${slug}/neighbors`
    )
    return res.data
  } catch {
    return null
  }
})
const prevPost = computed(() => nav.value?.prev ?? null)
const nextPost = computed(() => nav.value?.next ?? null)

interface NavPost {
  slug: string
  title: string
}

const { data: rendered } = await useAsyncData(`render-${slug}`, () =>
  parseArticleMarkdown(post.value!.content)
)

const minutes = readingTime(post.value.content ?? '')

/* ===== SEO：canonical / og:url / JSON-LD 结构化数据 ===== */
const siteUrl = useRuntimeConfig().public.siteUrl as string
const pageUrl = `${siteUrl.replace(/\/$/, '')}/blog/${slug}`

useHead({
  title: `${post.value.title} · spotgalaxy`,
  link: [{ rel: 'canonical', href: pageUrl }],
  meta: [
    { name: 'description', content: post.value.summary },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: pageUrl },
    // og:image 仅在封面为图片地址时输出,纯色值对分享无意义
    ...(post.value.cover && !isColorValue(post.value.cover)
      ? [{ property: 'og:image', content: absoluteUrl(post.value.cover, siteUrl) }]
      : [])
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.value.title,
        description: post.value.summary,
        datePublished: post.value.publishedAt ?? undefined,
        author: { '@type': 'Person', name: site.name },
        mainEntityOfPage: pageUrl,
        ...(post.value.cover && !isColorValue(post.value.cover)
          ? { image: absoluteUrl(post.value.cover, siteUrl) }
          : {})
      })
    }
  ]
})

const copied = ref(false)
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* 忽略剪贴板权限错误 */
  }
}

const shareUrl = computed(() =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.value!.title)}`
)

/* ===== 目录（共享组件 ArticleToc） ===== */
const hasToc = ref(extractHeadings(post.value?.content ?? '').length > 0)
const tocCollapsed = ref(false)

onMounted(() => {
  // 恢复折叠状态
  try {
    tocCollapsed.value = localStorage.getItem('toc-collapsed') === '1'
  } catch {
    /* 忽略存储异常 */
  }
})

watch(tocCollapsed, (v) => {
  if (import.meta.client) {
    try {
      localStorage.setItem('toc-collapsed', v ? '1' : '0')
    } catch {
      /* 忽略存储异常 */
    }
  }
})

/* ===== 阅读进度条 ===== */
const readProgress = ref(0)

function updateProgress() {
  const el = document.documentElement
  const total = el.scrollHeight - el.clientHeight
  readProgress.value = total > 0 ? Math.min(1, Math.max(0, el.scrollTop / total)) : 0
}

/* ===== 代码块语言标识 + 复制按钮（共享逻辑见 utils/codeblock.ts） ===== */

/* ===== 阅读量上报（后端同日同 IP 去重） ===== */
onMounted(() => {
  $fetch(`/api/posts/${slug}/view`, { method: 'POST' }).catch(() => {})
})

/* ===== AI 摘要（仅读缓存，未命中不展示） ===== */
const { data: aiSummary } = await useAsyncData(`ai-${slug}`, async () => {
  try {
    const res = await $fetch<ApiEnvelope<{ summary: string; model: string }>>(`/api/posts/${slug}/summary`)
    return res.data
  } catch {
    return null
  }
})

/* ===== 评论区 ===== */
interface CommentNode {
  id: number
  parentId: number | null
  author: string
  /** GitHub 头像快照（登录评论），可能为空 */
  avatarUrl?: string | null
  /** 邮箱 MD5（匿名旧评论，供 Gravatar），可能为空 */
  emailHash?: string | null
  content: string
  createdAt: string
  replies: CommentNode[]
}

/** 头像优先级：GitHub 头像 → Gravatar（匿名旧评论）→ 字底色占位 */
const avatarSrc = (c: { avatarUrl?: string | null; emailHash?: string | null }) =>
  c.avatarUrl || (c.emailHash ? gravatarUrl(c.emailHash) : null)

/* 头像状态：字底色头像始终显示，网络头像加载成功后淡入覆盖（加载失败保持字头像） */
const avatarFailed = reactive(new Set<number>())
const avatarLoaded = reactive(new Set<number>())
const markAvatarFailed = (id: number) => {
  avatarFailed.add(id)
}
const markAvatarLoaded = (id: number) => {
  avatarLoaded.add(id)
}

/* ===== GitHub 登录评论：后端启用 OAuth 时评论区切换为登录制 ===== */
const commentToken = useCookie('blog_comment_token')
const { data: ghCommentStatus } = await useAsyncData('gh-comment-status', async () => {
  try {
    const res = await $fetch<ApiEnvelope<{ enabled: boolean }>>('/api/auth/github/status')
    return res.data
  } catch {
    return { enabled: false }
  }
})
const ghEnabled = computed(() => ghCommentStatus.value?.enabled ?? false)

interface GhMe {
  login: string
  avatarUrl: string
}
const ghMe = ref<GhMe | null>(null)

onMounted(async () => {
  if (!ghEnabled.value || !commentToken.value) return
  try {
    const res = await $fetch<ApiEnvelope<GhMe>>('/api/auth/github/me', {
      headers: { Authorization: `Bearer ${commentToken.value}` }
    })
    ghMe.value = res.data
  } catch {
    // 令牌过期/失效：清掉，展示登录按钮
    commentToken.value = null
  }
})

const ghLogout = () => {
  commentToken.value = null
  ghMe.value = null
}

const { data: comments, refresh: refreshComments } = await useAsyncData(`comments-${slug}`, async () => {
  try {
    const res = await $fetch<ApiEnvelope<CommentNode[]>>(`/api/posts/${slug}/comments`)
    return res.data
  } catch {
    return []
  }
})

const commentForm = reactive({ author: '', email: '', content: '', parentId: null as number | null })
const commentMsg = ref('')
const commentSubmitting = ref(false)
const replyTo = ref<CommentNode | null>(null)

const startReply = (c: CommentNode) => {
  replyTo.value = c
  commentForm.parentId = c.id
}
const cancelReply = () => {
  replyTo.value = null
  commentForm.parentId = null
}

const submitComment = async () => {
  if (commentSubmitting.value) return
  commentSubmitting.value = true
  commentMsg.value = ''
  try {
    const ghMode = ghEnabled.value
    const headers = ghMode && commentToken.value
      ? { Authorization: `Bearer ${commentToken.value}` }
      : undefined
    await $fetch(`/api/posts/${slug}/comments`, {
      method: 'POST',
      headers,
      body: ghMode
        ? {
            content: commentForm.content,
            parentId: commentForm.parentId ?? undefined
          }
        : {
            author: commentForm.author,
            email: commentForm.email || undefined,
            content: commentForm.content,
            parentId: commentForm.parentId ?? undefined
          }
    })
    commentForm.content = ''
    cancelReply()
    commentMsg.value = '提交成功，审核通过后将展示'
    await refreshComments()
  } catch (e: any) {
    commentMsg.value = e?.data?.message || '提交失败，请稍后再试'
  } finally {
    commentSubmitting.value = false
  }
}

onMounted(() => {
  updateProgress()
  window.addEventListener('scroll', updateProgress, { passive: true })
  nextTick(setupCodeCopy)
})

watch(rendered, () => {
  if (import.meta.client) nextTick(setupCodeCopy)
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('scroll', updateProgress)
})
</script>

<template>
  <!-- ===== 阅读进度条 ===== -->
  <div class="read-progress" aria-hidden="true">
    <div class="read-progress-bar" :style="{ transform: `scaleX(${readProgress})` }" />
  </div>

  <main v-if="post" class="article-shell" :class="{ 'with-toc': hasToc, 'toc-collapsed': tocCollapsed && hasToc, 'has-hero': !!post.cover }">
    <div class="article-col">
      <!-- ===== 顶部封面（向下渐模糊） ===== -->
      <div class="article-hero">
        <PostCover :cover="post.cover" :alt="post.title" direction="bottom" class="article-hero-cover" />
      </div>

      <!-- ===== 文章头部 ===== -->
      <section class="article-head">
        <img src="/svg/spotgalaxy-v15-sidebar.svg" alt="spotgalaxy" class="brand-mark" />

        <NuxtLink to="/blog" class="back-link font-serif-warm">
          <span>&larr;</span> 返回博客列表
        </NuxtLink>

        <div class="head-tags">
          <template v-for="(tag, i) in post.tags" :key="tag">
            <span v-if="i > 0" class="tag-sep">·</span>
            <span class="head-tag font-serif-warm">{{ tag }}</span>
          </template>
        </div>

        <h1 class="head-title font-serif-warm">{{ post.title }}</h1>

        <div class="head-meta font-serif-warm">
          <time :datetime="post.publishedAt">{{ formatDateFull(post.publishedAt) }}</time>
          <span class="meta-sep">·</span>
          <span>约 {{ minutes }} 分钟阅读</span>
          <span class="meta-sep">·</span>
          <span>{{ post.viewCount ?? 0 }} 次阅读</span>
          <span class="meta-sep">·</span>
          <span>{{ site.name }}</span>
        </div>

        <div class="head-divider" />

        <!-- ===== AI 摘要（命中缓存时展示） ===== -->
        <section v-if="aiSummary" class="ai-summary">
          <p class="ai-label font-serif-warm">AI 摘要</p>
          <p class="ai-text">{{ aiSummary.summary }}</p>
        </section>
      </section>

      <!-- ===== 正文 ===== -->
      <article class="article-body">
        <ContentRenderer :value="rendered" class="article-content" />
      </article>

      <!-- ===== 文章底部 ===== -->
      <section class="article-foot">
        <div class="foot-divider" />

        <div class="foot-tags">
          <span class="foot-label font-serif-warm">标签：</span>
          <NuxtLink
            v-for="tag in post.tags"
            :key="tag"
            :to="{ path: '/blog', query: { tag } }"
            class="tag-chip font-serif-warm"
          >
            {{ tag }}
          </NuxtLink>
        </div>

        <div class="foot-share">
          <span class="foot-label font-serif-warm">分享：</span>
          <!-- <a :href="shareUrl" target="_blank" rel="noopener" class="share-link font-serif-warm">
            分享到 Twitter
          </a> -->
          <button class="share-link font-serif-warm" @click="copyLink">
            {{ copied ? '已复制 ✓' : '复制链接' }}
          </button>
        </div>
      </section>

      <!-- ===== 上下篇导航 ===== -->
      <section class="article-nav">
        <div class="foot-divider" />
        <div class="nav-wrap">
          <NuxtLink v-if="prevPost" :to="'/blog/' + prevPost.slug" class="nav-item prev">
            <div class="nav-label font-serif-warm">上一篇</div>
            <div class="nav-title-wrap">
              <span class="nav-arrow">&larr;</span>
              <span class="nav-title font-serif-warm">{{ prevPost.title }}</span>
            </div>
          </NuxtLink>
          <span v-else />

          <NuxtLink v-if="nextPost" :to="'/blog/' + nextPost.slug" class="nav-item next">
            <div class="nav-label font-serif-warm">下一篇</div>
            <div class="nav-title-wrap right">
              <span class="nav-title font-serif-warm">{{ nextPost.title }}</span>
              <span class="nav-arrow">&rarr;</span>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- ===== 评论区 ===== -->
      <section class="article-comments">
        <div class="foot-divider" />
        <h2 class="comments-title font-serif-warm">评论</h2>

        <ul v-if="(comments ?? []).length" class="comment-list">
          <li v-for="c in comments ?? []" :key="c.id" class="comment-item">
            <div class="comment-head">
              <span
                class="comment-avatar"
                :style="{ '--avatar-hue': avatarHue(c.avatarUrl || c.emailHash) }"
              >
                <span class="avatar-fallback">{{ c.author.charAt(0) }}</span>
                <img
                  v-if="avatarSrc(c) && !avatarFailed.has(c.id)"
                  :src="avatarSrc(c)!"
                  :alt="c.author + ' 的头像'"
                  loading="lazy"
                  width="32"
                  height="32"
                  :class="{ on: avatarLoaded.has(c.id) }"
                  @load="markAvatarLoaded(c.id)"
                  @error="markAvatarFailed(c.id)"
                />
              </span>
              <span class="comment-author">{{ c.author }}</span>
              <span class="comment-time">{{ formatDateFull(c.createdAt) }}</span>
            </div>
            <p class="comment-content">{{ c.content }}</p>
            <button class="comment-reply font-serif-warm" @click="startReply(c)">回复</button>

            <ul v-if="c.replies?.length" class="comment-replies">
              <li v-for="r in c.replies" :key="r.id" class="comment-item reply">
                <div class="comment-head">
                  <span
                    class="comment-avatar"
                    :style="{ '--avatar-hue': avatarHue(r.avatarUrl || r.emailHash) }"
                  >
                    <span class="avatar-fallback">{{ r.author.charAt(0) }}</span>
                    <img
                      v-if="avatarSrc(r) && !avatarFailed.has(r.id)"
                      :src="avatarSrc(r)!"
                      :alt="r.author + ' 的头像'"
                      loading="lazy"
                      width="32"
                      height="32"
                      :class="{ on: avatarLoaded.has(r.id) }"
                      @load="markAvatarLoaded(r.id)"
                      @error="markAvatarFailed(r.id)"
                    />
                  </span>
                  <span class="comment-author">{{ r.author }}</span>
                  <span class="comment-time">{{ formatDateFull(r.createdAt) }}</span>
                </div>
                <p class="comment-content">{{ r.content }}</p>
              </li>
            </ul>
          </li>
        </ul>
        <p v-else class="comments-empty">还没有评论，来说两句吧</p>

        <!-- GitHub 登录制：登录后发评论；未配置 OAuth 时回退匿名昵称模式 -->
        <template v-if="ghEnabled">
          <div v-if="ghMe" class="comment-identity">
            <img
              :src="ghMe.avatarUrl"
              :alt="ghMe.login + ' 的头像'"
              class="identity-avatar"
              width="28"
              height="28"
              referrerpolicy="no-referrer"
            />
            <span class="identity-name">{{ ghMe.login }}</span>
            <button type="button" class="identity-logout" @click="ghLogout">退出登录</button>
          </div>
          <a
            v-else
            class="gh-login-btn font-serif-warm"
            :href="`/api/auth/github/start?redirect=${encodeURIComponent(route.fullPath)}`"
          >
            <svg class="gh-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.082-.73.082-.73 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            使用 GitHub 登录后评论
          </a>
        </template>

        <form v-if="!ghEnabled || ghMe" class="comment-form" @submit.prevent="submitComment">
          <p v-if="replyTo" class="replying">
            回复 <strong>{{ replyTo.author }}</strong>
            <button type="button" class="reply-cancel" @click="cancelReply">取消</button>
          </p>
          <div v-if="!ghEnabled" class="comment-fields">
            <input v-model="commentForm.author" class="comment-input" placeholder="昵称 *" maxlength="50" required />
            <input v-model="commentForm.email" class="comment-input" type="email" placeholder="邮箱（可选，不公开）" maxlength="200" />
          </div>
          <textarea v-model="commentForm.content" class="comment-textarea" placeholder="写下你的评论…" maxlength="2000" required />
          <div class="comment-actions">
            <span class="comment-msg">{{ commentMsg }}</span>
            <button type="submit" class="comment-submit font-serif-warm" :disabled="commentSubmitting">
              {{ commentSubmitting ? '提交中…' : '提交评论' }}
            </button>
          </div>
          <p class="comment-note">提交后需审核通过才会展示</p>
        </form>
        <p v-else class="comments-empty">登录后即可发表评论，评论需审核通过后展示</p>
      </section>
    </div>

    <!-- ===== 右侧目录侧边栏（共享组件，桌面侧栏 + 移动端抽屉） ===== -->
    <ArticleToc
      :markdown="post.content"
      :rendered="rendered"
      v-model:collapsed="tocCollapsed"
      @update:has-toc="hasToc = $event"
    />
  </main>
</template>

<style scoped>
/* ===== 阅读进度条 ===== */
.read-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 80;
  pointer-events: none;
}
.read-progress-bar {
  height: 100%;
  background: var(--blog-primary);
  transform: scaleX(0);
  transform-origin: 0 50%;
  transition: transform 0.08s linear;
}

.article-shell {
  max-width: var(--blog-content-wide);
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 48px;
  align-items: start;
}
.article-shell.with-toc {
  grid-template-columns: minmax(0, 1fr) 240px;
}
.article-shell.with-toc.toc-collapsed {
  grid-template-columns: minmax(0, 1fr) 48px;
}
.article-col {
  min-width: 0;
}

/* ===== 左上角品牌标 ===== */
.brand-mark {
  display: block;
  width: 132px;
  height: auto;
  margin-bottom: 24px;
}

.article-head,
.article-body,
.article-foot,
.article-nav {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}

/* ===== 顶部封面 hero ===== */
.article-hero {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  padding: 40px 24px 0;
}
.article-hero-cover {
  width: 100%;
  aspect-ratio: 21 / 9;
  border-radius: var(--blog-radius-md);
}
/* 有封面时压缩头部上边距,让渐隐的封面与标题保持呼吸感 */
.article-shell.has-hero .article-head {
  padding-top: 24px;
}

/* ===== 头部 ===== */
.article-head {
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
.head-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.head-tag {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--blog-primary);
}
.tag-sep {
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}
.head-title {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: var(--blog-foreground);
}
@media (min-width: 640px) {
  .head-title {
    font-size: 2.25rem;
  }
}
@media (min-width: 768px) {
  .head-title {
    font-size: 3rem;
  }
}
.head-meta {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}
.meta-sep {
  color: var(--blog-border);
}
.head-divider {
  margin-top: 32px;
  height: 1px;
  width: 100%;
  background: var(--blog-border);
}

/* ===== 正文 ===== */
.article-body {
  padding-bottom: 48px;
}
/* 标题锚点滚动偏移（避免被顶部遮挡） */
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  scroll-margin-top: 88px;
}
/* 引言段首字下沉（杂志式） */
.article-body :deep(.article-content > p:first-of-type)::first-letter {
  float: left;
  font-family: var(--blog-font-serif);
  font-size: 3.8rem;
  line-height: 0.9;
  padding-right: 0.5rem;
  padding-top: 0.35rem;
  color: var(--blog-primary);
  font-weight: 600;
}

/* ===== 底部 ===== */
.article-foot {
  padding-bottom: 40px;
}
.foot-divider {
  height: 1px;
  width: 100%;
  background: var(--blog-border);
  margin-bottom: 32px;
}
.foot-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.foot-label {
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}
.tag-chip {
  font-size: 0.875rem;
  color: var(--blog-foreground);
  border: 1px solid var(--blog-border);
  background: var(--blog-card);
  padding: 4px 10px;
  border-radius: var(--blog-radius-sm);
  text-decoration: none;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}
.tag-chip:hover {
  color: var(--blog-primary);
  border-color: color-mix(in srgb, var(--blog-primary) 40%, transparent);
}
.foot-share {
  display: flex;
  align-items: center;
  gap: 20px;
}
.share-link {
  font-size: 0.875rem;
  color: var(--blog-foreground);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-underline-offset: 2px;
  transition: color 0.2s ease;
}
.share-link:hover {
  color: var(--blog-primary);
  text-decoration: underline;
}

/* ===== 上下篇 ===== */
.article-nav {
  padding-bottom: 64px;
}
.nav-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@media (min-width: 640px) {
  .nav-wrap {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
.nav-item {
  max-width: 48%;
}
.nav-item.next {
  text-align: right;
  margin-left: auto;
}
@media (max-width: 639px) {
  .nav-item {
    max-width: 100%;
  }
}
.nav-label {
  font-size: 0.75rem;
  color: var(--blog-muted-foreground);
  margin-bottom: 6px;
}
.nav-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.nav-title-wrap.right {
  justify-content: flex-end;
}
.nav-arrow {
  color: var(--blog-primary);
  margin-top: 2px;
  flex-shrink: 0;
}
.nav-title {
  font-size: 0.875rem;
  line-height: 1.375;
  color: var(--blog-foreground);
  transition: color 0.2s ease;
}
.nav-item:hover .nav-title {
  color: var(--blog-primary);
}

/* ===== AI 摘要 ===== */
.ai-summary {
  max-width: var(--blog-content-narrow, 720px);
  margin: 24px auto 0;
  padding: 16px 20px;
  border-left: 3px solid var(--blog-primary);
  background: var(--blog-card);
  border-radius: 0 var(--blog-radius-sm) var(--blog-radius-sm) 0;
}
.ai-label { font-size: 0.8rem; color: var(--blog-primary); margin-bottom: 6px; }
.ai-text { font-size: 0.95rem; color: var(--blog-muted-foreground); line-height: 1.7; }

/* ===== 评论区 ===== */
.article-comments { margin-top: 8px; }
.comments-title { font-size: 1.4rem; color: var(--blog-foreground); margin: 24px 0 16px; }
.comment-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 0 24px;
  padding: 0;
}
.comment-item {
  padding: 16px;
  border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-md);
  background: var(--blog-card);
}
.comment-item.reply { margin-top: 12px; }
.comment-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.comment-avatar {
  position: relative;
  width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  flex-shrink: 0; display: inline-flex; background: var(--blog-border);
}
.comment-avatar img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transition: opacity 0.25s ease;
}
.comment-avatar img.on { opacity: 1; }
.avatar-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.9rem; font-weight: 600;
  background: hsl(var(--avatar-hue, 200) 42% 52%);
}
.comment-author { font-weight: 500; color: var(--blog-foreground); font-size: 0.95rem; }
.comment-time { font-size: 0.75rem; color: var(--blog-muted-foreground); margin-left: auto; }
.comment-content { color: var(--blog-foreground); font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap; margin: 0 0 8px; }
.comment-reply {
  background: none; border: none; padding: 0;
  font-size: 0.8rem; color: var(--blog-primary); cursor: pointer;
}
.comment-replies { list-style: none; margin: 0; padding: 0; }
.comments-empty { color: var(--blog-muted-foreground); font-size: 0.9rem; margin-bottom: 24px; }
.comment-form { display: flex; flex-direction: column; gap: 12px; }
.replying { font-size: 0.85rem; color: var(--blog-muted-foreground); display: flex; align-items: center; gap: 8px; }
.reply-cancel { background: none; border: none; color: var(--blog-primary); cursor: pointer; font-size: 0.85rem; }
.comment-fields { display: flex; gap: 12px; flex-wrap: wrap; }
.comment-input {
  flex: 1; min-width: 200px;
  padding: 10px 14px; border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-sm); background: var(--blog-card);
  color: var(--blog-foreground); font-size: 0.9rem; box-sizing: border-box;
}
.comment-textarea {
  min-height: 110px; padding: 12px 14px;
  border: 1px solid var(--blog-border); border-radius: var(--blog-radius-sm);
  background: var(--blog-card); color: var(--blog-foreground);
  font-size: 0.9rem; line-height: 1.6; resize: vertical; box-sizing: border-box;
  font-family: inherit;
}
.comment-input:focus, .comment-textarea:focus {
  outline: none; border-color: var(--blog-primary);
}
.comment-actions { display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
.comment-msg { font-size: 0.8rem; color: var(--blog-muted-foreground); }
.comment-submit {
  padding: 8px 18px; border: 1px solid transparent; border-radius: 999px;
  background: var(--blog-primary); color: #fff;
  font-size: 0.875rem; cursor: pointer;
}
.comment-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.comment-note { font-size: 0.75rem; color: var(--blog-muted-foreground); margin: 0; }

/* ===== GitHub 登录评论 ===== */
.comment-identity {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.identity-avatar {
  width: 28px; height: 28px; border-radius: 50%; object-fit: cover;
}
.identity-name {
  font-size: 0.9rem; color: var(--blog-foreground); font-weight: 500;
}
.identity-logout {
  margin-left: auto; background: none; border: none; padding: 0;
  font-size: 0.8rem; color: var(--blog-muted-foreground); cursor: pointer;
}
.identity-logout:hover { color: var(--blog-primary); }
.gh-login-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 20px; margin-bottom: 16px;
  border: 1px solid var(--blog-border); border-radius: var(--blog-radius-sm);
  background: var(--blog-card); color: var(--blog-foreground);
  font-size: 0.9rem; text-decoration: none;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.gh-login-btn:hover {
  color: var(--blog-primary);
  border-color: color-mix(in srgb, var(--blog-primary) 40%, transparent);
}
.gh-icon { width: 18px; height: 18px; flex-shrink: 0; }

/* ===== 窄屏：目录侧栏隐藏、改由组件内的悬浮按钮 + 抽屉接管 ===== */
@media (max-width: 1024px) {
  .article-shell,
  .article-shell.with-toc {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
