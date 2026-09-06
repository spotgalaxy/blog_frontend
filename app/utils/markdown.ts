import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import rehypeMdcHighlight from '@nuxtjs/mdc/runtime/highlighter/rehype-nuxt'

// mdc 的 parseMarkdown 靠 #mdc-imports 虚拟模块挂载 rehype 高亮插件，但该别名
// 只注册在 Nitro 服务端：客户端路由导航时浏览器解析失败被 .catch 静默吞掉，
// 高亮插件根本不会挂载（SSR 首屏正常，站内跳转后代码块全白）。
// 显式传入插件实例后，客户端会走 /api/_mdc/highlight 接口完成高亮。
// theme 需与 nuxt.config.ts 的 content.build.markdown.highlight.theme 保持一致。
export function parseArticleMarkdown(md: string) {
  return parseMarkdown(md, {
    highlight: {
      theme: { default: 'github-light', dark: 'github-dark' }
    },
    rehype: {
      plugins: {
        highlight: { instance: rehypeMdcHighlight, options: {} }
      }
    }
  })
}
