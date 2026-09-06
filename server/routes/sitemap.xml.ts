// sitemap.xml：运行时拉取已发布文章与作品动态生成，搜索引擎抓取入口
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

  function escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  interface SitemapPage {
    path: string
    lastmod?: string | null
    priority?: string
  }

  const pages: SitemapPage[] = [
    { path: '/', priority: '1.0' },
    { path: '/blog', priority: '0.9' },
    { path: '/archive', priority: '0.6' },
    { path: '/tags', priority: '0.6' },
    { path: '/projects', priority: '0.9' },
    { path: '/about', priority: '0.5' }
  ]

  const [postsRes, projectsRes] = await Promise.allSettled([
    $fetch<{ code: number; data: Array<{ slug: string; publishedAt: string | null }> }>(`${config.apiBase}/api/posts`),
    $fetch<{ code: number; data: Array<{ slug: string }> }>(`${config.apiBase}/api/projects`)
  ])
  const posts = postsRes.status === 'fulfilled' ? postsRes.value?.data ?? [] : []
  const projects = projectsRes.status === 'fulfilled' ? projectsRes.value?.data ?? [] : []
  if (postsRes.status === 'rejected' || projectsRes.status === 'rejected') {
    console.warn('[sitemap.xml] 拉取数据失败，输出仅含静态页的 sitemap')
  }

  for (const p of posts) {
    pages.push({ path: `/blog/${p.slug}`, lastmod: p.publishedAt, priority: '0.8' })
  }
  for (const p of projects) {
    pages.push({ path: `/projects/${p.slug}`, priority: '0.7' })
  }

  const urls = pages
    .map((p) => `  <url>
    <loc>${siteUrl}${p.path}</loc>${
      p.lastmod ? `\n    <lastmod>${new Date(p.lastmod).toISOString()}</lastmod>` : ''
    }
  </url>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=1800')
  return xml
})
