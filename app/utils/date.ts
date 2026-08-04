/** 中文数字日期格式化工具 */
const CN_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function numToCn(n: number): string {
  if (n < 10) return CN_DIGITS[n]!
  if (n < 20) return '十' + (n % 10 ? CN_DIGITS[n % 10] : '')
  if (n < 100) {
    return CN_DIGITS[Math.floor(n / 10)]! + '十' + (n % 10 ? CN_DIGITS[n % 10] : '')
  }
  return String(n)
}

/** 年份 → 二〇二六 */
export function formatYearCn(year: number): string {
  return String(year)
    .split('')
    .map((d) => CN_DIGITS[Number(d)])
    .join('')
}

/** 完整中文数字日期：二〇二六年七月三十一日 */
export function formatDateCnFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatYearCn(d.getFullYear())}年${numToCn(d.getMonth() + 1)}月${numToCn(d.getDate())}日`
}

/** 中文月日：七月二十八日 */
export function formatDateCn(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${numToCn(d.getMonth() + 1)}月${numToCn(d.getDate())}日`
}

/** 标准格式：2026 年 7 月 28 日 */
export function formatDateFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}
