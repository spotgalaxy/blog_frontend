# spotgalaxy 博客前端（Nuxt 4 SSR）

个人博客站点前端：前台页面 + `/admin` 管理后台，SSR 渲染，数据全部来自后端 API（见 [blog_backend](../blog_backend)）。`/api/**` 由 `server/api/[...].ts` 代理转发到 Spring Boot（地址来自环境变量 `API_BASE`，默认 `http://localhost:8080`）。

## 功能

- **前台**：首页（精选作品 + 最新文章）、博客列表/详情（标签、阅读时长、目录、阅读量、评论、AI 摘要）、作品列表/详情、RSS（`/rss.xml`）
- **后台 `/admin`**：登录（JWT）、文章管理（Markdown 编辑 + 预览 + 发布 + AI 摘要生成）、作品管理、评论审核、统计看板（PV/UV + 热门 Top10）
- 阅读量上报、访客统计上报（路由变化时）

## 环境要求

- Node 24（本项目约定）、后端服务已运行

## 运行

```bash
npm install
npm run dev          # 开发，http://localhost:3000
```

生产：

```bash
npm run build
node .output/server/index.mjs
```

环境变量：`API_BASE`（SSR 服务端取数地址，默认 `http://localhost:8080`）。

## 后台使用

访问 `/admin` → 登录（账号见后端 `.env` 的 `ADMIN_USERNAME/ADMIN_PASSWORD`）→ 文章管理 / 作品管理 / 评论审核 / 统计看板。访客评论匿名提交，审核通过后展示。
