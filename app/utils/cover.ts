/**
 * 封面字段既支持图片地址（http(s)://、/、data: 等），也支持颜色值。
 * #hex / rgb() / hsl() 开头视为颜色，其余一律按图片地址处理。
 */
export function isColorValue(value?: string | null): boolean {
  return !!value && /^(#|rgb\(|hsl\()/i.test(value.trim())
}

/** 解析颜色为 RGB（支持 #rgb/#rgba/#rrggbb/#rrggbbaa、rgb()/rgba()、hsl()/hsla()），失败返回 null */
function parseColor(value: string): [number, number, number] | null {
  const s = value.trim().toLowerCase()
  if (s.startsWith('#')) {
    const h = s.slice(1)
    if (/^[0-9a-f]{3,4}$/.test(h)) {
      return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
    }
    if (/^[0-9a-f]{6}$/.test(h) || /^[0-9a-f]{8}$/.test(h)) {
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
    return null
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(s)
  if (rgb) {
    const n = rgb[1].split(/[,\s/]+/).filter(Boolean)
    const r = Number(n[0])
    const g = Number(n[1])
    const b = Number(n[2])
    return [r, g, b].every((x) => !Number.isNaN(x)) ? [r, g, b] : null
  }
  const hsl = /^hsla?\(([^)]+)\)$/.exec(s)
  if (hsl) {
    const n = hsl[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    const [h, sat, li] = n
    if ([h, sat, li].some((x) => Number.isNaN(x))) return null
    const a = sat / 100
    const l = li / 100
    const k = (x: number) => (x + h / 30) % 12
    const f = (x: number) =>
      l - a * Math.min(l * (1 - l), 1) * Math.max(-1, Math.min(k(x) - 3, Math.min(9 - k(x), 1)))
    return [f(0) * 255, f(8) * 255, f(4) * 255]
  }
  return null
}

/**
 * 封面文字黑白自适应：按 YIQ 感知亮度判断颜色深浅，
 * 浅色（>=150）返回 true（配黑字），深色或解析失败返回 false（配白字）。
 */
export function isLightColor(value?: string | null): boolean {
  const rgb = value ? parseColor(value) : null
  if (!rgb) return false
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 >= 150
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
