// 代码块右上角注入「语言标识 + 复制按钮」。
// pre 上的 language-* class 由 mdc 渲染管道写入（SSR 与客户端一致），样式见 main.css 的 .code-meta 段。
const LANG_LABELS: Record<string, string> = {
  js: 'JS', javascript: 'JS', ts: 'TS', typescript: 'TS', tsx: 'TSX', jsx: 'JSX',
  vue: 'Vue', html: 'HTML', css: 'CSS', scss: 'SCSS', less: 'Less',
  python: 'Python', py: 'Python', java: 'Java', kotlin: 'Kotlin', kt: 'Kotlin',
  go: 'Go', rust: 'Rust', rs: 'Rust', c: 'C', cpp: 'C++', csharp: 'C#', cs: 'C#',
  php: 'PHP', ruby: 'Ruby', rb: 'Ruby', swift: 'Swift', sql: 'SQL',
  bash: 'Shell', sh: 'Shell', shell: 'Shell', zsh: 'Shell',
  yaml: 'YAML', yml: 'YAML', json: 'JSON', md: 'Markdown', markdown: 'Markdown',
  docker: 'Docker', dockerfile: 'Docker'
}

export function setupCodeCopy(rootSelector = '.article-content') {
  if (!import.meta.client) return
  const root = document.querySelector(rootSelector)
  if (!root) return
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.code-meta')) return
    const langClass = [...pre.classList].find((c) => c.startsWith('language-'))
    const raw = langClass ? langClass.slice('language-'.length) : ''
    const lang = document.createElement('span')
    lang.className = 'code-lang'
    lang.textContent = LANG_LABELS[raw] ?? (raw || 'TEXT').toUpperCase()
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'code-copy-btn'
    btn.textContent = '复制'
    btn.addEventListener('click', async () => {
      const text = pre.querySelector('code')?.textContent ?? pre.textContent ?? ''
      try {
        await navigator.clipboard.writeText(text)
        btn.textContent = '已复制 ✓'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = '复制'
          btn.classList.remove('copied')
        }, 2000)
      } catch {
        /* 忽略剪贴板权限错误 */
      }
    })
    const meta = document.createElement('div')
    meta.className = 'code-meta'
    meta.append(lang, btn)
    pre.appendChild(meta)
  })
}
