// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  runtimeConfig: {
    apiBase: process.env.API_BASE || 'http://localhost:8080'
  },

  modules: ['@nuxt/content'],

  // 监听所有网卡，使局域网内设备也能访问（手机 / 同 Wi-Fi 的其他电脑）
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: 'spotgalaxy · 个人博客',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        {
          name: 'description',
          content: 'spotgalaxy的个人博客 — 关于技术、设计、阅读与生活的缓慢思考。'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'spotgalaxy' },
        { property: 'og:title', content: 'spotgalaxy · 个人博客' },
        {
          property: 'og:description',
          content: '关于技术、设计、阅读与生活的缓慢思考。'
        }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'github-light',
            dark: 'github-dark'
          },
          langs: ['css', 'ts', 'js', 'vue', 'html', 'bash', 'json', 'md']
        }
      }
    }
  },

  nitro: {
    prerender: {
      routes: ['/rss.xml']
    }
  }
})
