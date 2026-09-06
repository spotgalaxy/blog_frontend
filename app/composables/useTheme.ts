export function useTheme() {
  const isDark = useState<boolean>('blog-theme-dark', () => false)

  const apply = (dark: boolean) => {
    isDark.value = dark
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      localStorage.setItem('blog-theme', dark ? 'dark' : 'light')
    }
  }

  const toggle = () => apply(!isDark.value)

  onMounted(() => {
    const saved = localStorage.getItem('blog-theme')
    const dark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    // classList 已由 layout 的 head 内联脚本在首屏前处理，这里只同步切换图标的响应式状态
    isDark.value = dark
  })

  return { isDark, toggle }
}
