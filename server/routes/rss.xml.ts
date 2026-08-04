const SITE_URL = 'https://linshen.blog'
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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const res = await $fetch<{ code: number; data: Array<{ slug: string; title: string; summary: string; publishedAt: string | null }> }>(`${config.apiBase}/api/posts`)
  const posts = res.data

  const items = posts
    .filter((p) => p.publishedAt)
    .map((post) => {
      const link = `${SITE_URL}/blog/${post.slug}`
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
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>zh-CN</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  setResponseHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return xml
})
