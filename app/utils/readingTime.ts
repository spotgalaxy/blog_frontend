/**
 * 估算中文为主的混合文本阅读时长（分钟）。
 * 中文约 400 字/分钟，英文约 200 词/分钟。
 */
export function readingTime(text: string): number {
  if (!text) return 1
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[a-zA-Z0-9]+/g) || [])
    .length
  const minutes = cjk / 400 + words / 200
  return Math.max(1, Math.round(minutes))
}
