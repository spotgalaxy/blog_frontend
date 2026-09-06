// RSS 2.0 订阅：运行时动态生成（构建期预渲染会固化旧文章列表）
// 站点域名从 SITE_URL 环境变量读取，缺省与 utils/site.ts 保持一致
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const SITE_TITLE = 'spotgalaxy · 个人博客'
  const SITE_DESC = '关于技术、设计、阅读与生活的缓慢思考。'

  function escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  let posts: Array<{ slug: string; title: string; summary: string; publishedAt: string | null }> = []
  try {
    const res = await $fetch<{ code: number; data: Array<{ slug: string; title: string; summary: string; publishedAt: string | null }> }>(`${config.apiBase}/api/posts`)
    posts = res?.data ?? []
  } catch (err) {
    console.warn('[rss.xml] 获取文章列表失败，已生成空 feed：', err)
  }

  const items = posts
    .filter((p) => p.publishedAt)
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary ?? '')}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>zh-CN</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  setResponseHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=1800')
  return xml
})
