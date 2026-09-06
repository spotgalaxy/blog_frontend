// GitHub OAuth 授权跳转透传：后端返回 302 → github.com 授权页。
// 不能走通用代理（其内部 fetch 会跟随 302 自己去连 github.com，网络不通即 502），
// 这里以 redirect:'manual' 拿到 Location 原样回给浏览器。
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = event.path.includes('?') ? event.path.slice(event.path.indexOf('?')) : ''
  const ip =
    getRequestHeader(event, 'cf-connecting-ip') ||
    getRequestIP(event, { xForwardedFor: true }) ||
    event.node?.req?.socket?.remoteAddress ||
    ''
  try {
    const res = await $fetch.raw(`${config.apiBase}/api/auth/github/start${query}`, {
      redirect: 'manual',
      headers: { 'x-forwarded-for': ip }
    })
    setResponseStatus(event, res.status)
    const location = res.headers.get('location')
    if (location) setResponseHeader(event, 'location', location)
    return res._data
  } catch (err: any) {
    throw createError({
      statusCode: err?.statusCode || 502,
      statusMessage: err?.statusMessage || 'OAuth start proxy failed'
    })
  }
})
