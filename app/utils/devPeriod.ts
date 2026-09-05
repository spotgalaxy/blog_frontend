/** "2024-03" → "2024.03" */
function fmtYearMonth(v: string): string {
  return v.replace('-', '.')
}

/**
 * 开发时间展示："2024-03" + "2025-01" → "2024.03 - 2025.01"。
 * 只填开始视为进行中（"2024.03 至今"），都为空返回空字符串。
 */
export function formatDevPeriod(start?: string | null, end?: string | null): string {
  const s = start?.trim()
  const e = end?.trim()
  if (!s && !e) return ''
  if (!s) return fmtYearMonth(e)
  return fmtYearMonth(s) + (e ? ' - ' + fmtYearMonth(e) : ' 至今')
}
