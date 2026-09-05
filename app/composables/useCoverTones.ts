/**
 * 封面文字黑白自适应：浅色封面底返回 'light'（配黑字），深色底返回 'dark'（配白字）。
 * - 颜色值同步判定（SSR 阶段即可完成，无闪烁）
 * - 图片地址在客户端用 canvas 缩到 16×16 估平均亮度（跨域图片无 CORS 头时分析失败，保持默认白字）
 *
 * 用法：
 *   const { toneClass } = useCoverTones(() => projects.value?.map(p => p.cover))
 *   <div :class="toneClass(cover)">…</div>
 */
export function useCoverTones(getCovers: () => (string | null | undefined)[]) {
  const tones = ref<Record<string, 'light' | 'dark'>>({})

  /** 返回 'tone-light' / 'tone-dark'，封面为空或图片未分析完时返回 ''（走默认白字样式） */
  const toneClass = (cover?: string | null): string => {
    const t = cover ? tones.value[cover] : undefined
    return t ? `tone-${t}` : ''
  }

  function analyzeImage(url: string) {
    if (import.meta.server) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 16
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, 16, 16)
        const d = ctx.getImageData(0, 0, 16, 16).data
        let r = 0
        let g = 0
        let b = 0
        for (let i = 0; i < d.length; i += 4) {
          r += d[i]
          g += d[i + 1]
          b += d[i + 2]
        }
        const n = d.length / 4
        const yiq = (r * 299 + g * 587 + b * 114) / 1000 / n
        tones.value[url] = yiq >= 150 ? 'light' : 'dark'
      } catch {
        /* 画布被跨域污染：保持默认白字 */
      }
    }
    img.src = url
  }

  watch(
    getCovers,
    (list) => {
      for (const v of list) {
        if (!v || tones.value[v]) continue
        if (isColorValue(v)) tones.value[v] = isLightColor(v) ? 'light' : 'dark'
        else analyzeImage(v)
      }
    },
    { immediate: true }
  )

  return { tones, toneClass }
}
