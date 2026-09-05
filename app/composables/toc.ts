interface TocHeading {
  level: number
  text: string
}

/** 从 Markdown 提取 h2-h4 标题（仅作 SSR 首屏兜底，客户端会用真实 DOM 重建，保证与正文一一对应） */
export function extractHeadings(md: string): TocHeading[] {
  if (!md) return []
  // 去掉围栏代码块，避免把代码里的 # 误判为标题
  const cleaned = md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
  const out: TocHeading[] = []
  for (const line of cleaned.split('\n')) {
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (m) {
      const level = m[1].length
      if (level >= 2 && level <= 4) out.push({ level, text: m[2].trim() })
    }
  }
  return out
}
