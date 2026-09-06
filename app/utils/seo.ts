/** 相对路径转绝对 URL（og:image、JSON-LD 要求绝对地址；已是 http(s) 开头则原样返回） */
export function absoluteUrl(url: string, base: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return base.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url)
}

/**
 * Gravatar 头像地址：d=404 让无头像用户回退到前端占位样式，
 * 而不是显示难看的默认图；网络不通时同样走前端回退
 */
export function gravatarUrl(emailHash: string, size = 64): string {
  return `https://www.gravatar.com/avatar/${emailHash}?d=404&s=${size}`
}

/** 由邮箱哈希派生稳定的头像底色（0-360 色相） */
export function avatarHue(emailHash: string | null | undefined): number {
  if (!emailHash) return 200
  return parseInt(emailHash.slice(0, 2), 16) / 255 * 360
}
