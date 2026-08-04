// 后端 API 透传代理（catch-all）
// 注意：/api/_mdc/** 是 @nuxtjs/mdc 的代码高亮内部 API，不能转发到 Spring Boot
// （会 404 并在后端产生错误日志），直接返回 404 留给前端处理。
// ⚠️ target 必须保留 /api 前缀：event.path 去掉 /api 后 path=/posts，
//    拼回 ${apiBase}/api${path} 得到 http://host/api/posts，不能丢 /api。
export default defineEventHandler(async (event) => {
  const path = event.path.replace(/^\/api/, '')
  if (path.startsWith('/_mdc/')) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  const config = useRuntimeConfig(event)
  return proxyRequest(event, `${config.apiBase}/api${path}`)
})
