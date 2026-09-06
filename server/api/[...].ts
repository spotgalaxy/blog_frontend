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
  // 把真实客户端 IP 传给后端：经过 CF/本代理后，TCP 对端只剩代理 IP，
  // 后端阅读量去重、评论限频、UV 统计都依赖它。
  // 优先 CF-Connecting-IP（Cloudflare 注入的真实访客 IP，客户端伪造无效），
  // 其次 X-Forwarded-For（其他反代场景），最后才是对端地址（本地开发）
  const ip =
    getRequestHeader(event, 'cf-connecting-ip') ||
    getRequestIP(event, { xForwardedFor: true }) ||
    event.node?.req?.socket?.remoteAddress ||
    ''
  return proxyRequest(event, `${config.apiBase}/api${path}`, {
    headers: { 'x-forwarded-for': ip },
    // 不跟随后端的 302（如 GitHub OAuth 授权跳转），原样透传给浏览器；
    // 否则代理会自己去连 github.com，网络不通时报 502
    redirect: 'manual'
  } as any)
})
