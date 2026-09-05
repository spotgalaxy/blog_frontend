/**
 * 封面字段既支持图片地址（http(s)://、/、data: 等），也支持颜色值。
 * #hex / rgb() / hsl() 开头视为颜色，其余一律按图片地址处理。
 */
export function isColorValue(value?: string | null): boolean {
  return !!value && /^(#|rgb\(|hsl\()/i.test(value.trim())
}

/**
 * 封面统一渲染样式：颜色返回 background，图片返回 background-image（铺满裁切）。
 * 项目封面（卡片、详情页）和文章封面共用。
 */
export function coverStyle(value?: string | null): Record<string, string> {
  const v = value?.trim()
  if (!v) return {}
  if (isColorValue(v)) return { background: v }
  return {
    backgroundImage: `url("${v}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}
