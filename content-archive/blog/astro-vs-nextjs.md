---
title: Astro 与 Next.js：我为什么选择了 Astro
date: 2026-07-15
summary: 从性能、开发体验到生态，全面对比两个主流框架的适用场景……
tags: [前端]
---

经过三个月的深度使用和对比，我最终把博客从 Next.js 迁移到了 Astro。这篇文章分享我的决策过程和迁移体验，希望能给同样纠结的你一些参考。

## 两种截然不同的哲学

Next.js 和 Astro 都能做静态站点，但它们的出发点完全不同。Next.js 是一个全栈 React 框架，静态导出只是它众多能力之一；而 Astro 从第一天起就是为内容型网站而生的——默认零 JavaScript，按需注水（Islands 架构）。

对于博客这种 95% 是静态内容的站点来说，Astro 的默认零 JS 意味着更快的首屏加载。我的 Lighthouse 性能分数从 92 分直接到了满分。

## 写作体验对比

在 Next.js 里写 Markdown 需要配置 MDX 或引入 contentlayer 之类的库，整个链路比较长。而 Astro 的 Content Collections 是原生能力：

```ts
const posts = await getCollection('blog')
```

自带类型校验的 frontmatter、自动生成路由，写作体验顺滑得像在用 Obsidian。

## 什么时候该选 Next.js

如果你的站点有大量交互、需要服务端状态、或者本质上是一个 Web 应用而不是内容站，Next.js 依然是更好的选择。工具没有绝对的好坏，只有是否匹配场景。

## 迁移成本

整个迁移花了两个周末。最耗时的是把 React 组件改写成 `.astro` 组件，但模板语法几乎一样，肌肉记忆可以无缝迁移。如果你也在考虑迁移，建议先从一个边缘页面开始试水。
