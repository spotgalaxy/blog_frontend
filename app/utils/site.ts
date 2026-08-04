/** 站点元信息与社交链接（按需修改） */
export const site = {
  name: 'spotgalaxy',
  title: 'spotgalaxy · 个人博客',
  description: '关于技术、设计、阅读与生活的缓慢思考。',
  url: 'https://www.spotgalaxy.top',
  email: 'mailto:spotgalaxy_23@163.com',
  nav: [
    { label: '首页', href: '/' },
    { label: '博客', href: '/blog' },
    { label: '作品', href: '/projects' },
    { label: '关于', href: '/about' },
    { label: '管理', href: '/admin' }
  ],
  socials: [
    { label: '邮箱', href: 'mailto:spotgalaxy_23@163.com' },
    { label: 'GitHub', href: 'https://github.com/spotgalaxy' }
  ]
} as const
