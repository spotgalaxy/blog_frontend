<script setup lang="ts">
useHead({ title: '关于我 · spotgalaxy' })

const skills = [
  { name: '前端开发', items: 'React、Vue、TypeScript、Astro、Tailwind CSS' },
  { name: '后端与工具', items: 'Node.js、PostgreSQL、Git、Docker、Java、Spring boot、C、Maven' }
]

const timeline = [
  {
    period: '2025-2026',
    title: '某大学 · 软件工程',
    desc: '系统学习计算机基础知识，第一次接触编程和开发。'
  }
]
</script>

<template>
  <main>
    <!-- ===== Hero ===== -->
    <section class="hero">
      <div class="avatar-wrap">
        <div class="avatar">
          <span class="avatar-char font-serif-warm">spotgalaxy</span>
        </div>
      </div>

      <h1 class="hero-title font-serif-warm">关于我</h1>
      <p class="hero-sub font-serif-warm">后端开发者 · 写作者 · 永远的学习者</p>

      <img src="/svg/spotgalaxy-v9-stacked.svg" alt="spotgalaxy" class="hero-deco brand-v9" />
    </section>

    <!-- ===== 你好 — 书信式 ===== -->
    <section class="section">
      <div class="section-head">
        <SectionTitle title="你好" />
      </div>
      <div class="prose">
        <p>
          我是spotgalaxy，一名专注于后端开发的工程师。从 2026 年开始接触 Web 开发。现在我还在大学，第一次用 HTML 和 CSS 做出一个简陋的个人主页时，那种从无到有的创造感，至今还清晰地记得。
        </p>
        <p>
          在过去的2025年里，我从一个什么都不会的小白成长为现在的样子，我认为离不开学习，所以更深入的学习和汲取知识是非常重要的。
        </p>
        <p>
          闲暇之时，我喜欢写博客记录学习心得，也会做一些独立开发的小项目。这个博客就是我记录和分享的地方，希望能对你有所帮助。我始终认为，输出是最好的输入——在整理思绪、写下文字的过程中，自己也在不断地成长和清晰。
        </p>
        <p>
          如果你对我的项目感兴趣，或者想聊聊技术、设计、独立开发，欢迎通过邮件或社交媒体联系我。我相信每一次对话都可能带来新的启发，而连接本身就是一件美好的事情。
        </p>
      </div>
    </section>

    <!-- ===== 技能 & 工具 ===== -->
    <section class="section">
      <div class="section-head">
        <SectionTitle title="技能 &amp; 工具" />
      </div>
      <div class="skill-list">
        <div v-for="s in skills" :key="s.name" class="skill-item">
          <p class="skill-name font-serif-warm">{{ s.name }}</p>
          <p class="skill-items">{{ s.items }}</p>
        </div>
      </div>
    </section>

    <!-- ===== 经历时间线 ===== -->
    <section class="section">
      <div class="section-head">
        <SectionTitle title="经历" />
      </div>
      <div class="timeline">
        <div v-for="t in timeline" :key="t.period" class="timeline-item">
          <p class="timeline-period tabular">{{ t.period }}</p>
          <p class="timeline-title font-serif-warm">{{ t.title }}</p>
          <p class="timeline-desc">{{ t.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ===== 联系方式 ===== -->
    <section class="section contact">
      <div class="section-head">
        <SectionTitle title="联系方式" />
      </div>
      <div class="prose">
        <p>
          如果你有任何想法、疑问，或者只是想打个招呼，都欢迎随时联系我。我会尽量回复每一封邮件——虽然有时候可能会慢一点，但每一封信都会认真读完。
        </p>
        <p>
          你可以通过邮件找到我：
          <a :href="`mailto:${site.email}`" class="mail-link">{{ site.email }}</a>
        </p>
      </div>

      <div class="contact-signature">
        <p class="signature">期待与你相遇。—— {{ site.name }}</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ===== Hero ===== */
.hero {
  max-width: 560px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}
@media (min-width: 768px) {
  .hero {
    padding: 64px 24px 80px;
  }
}
.avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d97706 0%, #92400e 100%);
}
.avatar-char {
  font-size: 1.875rem;
  font-weight: 500;
  /* 日间黑、夜间白,跟随主题 */
  color: var(--blog-foreground);
}
.hero-title {
  text-align: center;
  font-size: 2.25rem;
  font-weight: 500;
  line-height: 1.25;
  color: var(--blog-foreground);
}
@media (min-width: 768px) {
  .hero-title {
    font-size: 3rem;
  }
}
.hero-sub {
  margin-top: 16px;
  text-align: center;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  color: var(--blog-muted-foreground);
}
.hero-deco {
  margin-top: 40px;
}
/* v9 叠排字标替换原分隔线 */
.brand-v9 {
  display: block;
  width: 216px;
  height: auto;
  margin-left: auto;
  margin-right: auto;
}

/* ===== 通用 section ===== */
.section {
  max-width: var(--blog-content-narrow);
  margin: 0 auto;
  padding: 48px 24px;
}
@media (min-width: 768px) {
  .section {
    padding: 64px 24px;
  }
}
.section-head {
  margin-bottom: 40px;
}
.prose {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-size: 15px;
  line-height: 2;
  color: color-mix(in srgb, var(--blog-foreground) 80%, transparent);
}
@media (min-width: 768px) {
  .prose {
    font-size: 1rem;
  }
}

/* ===== 技能 ===== */
.skill-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
  font-size: 15px;
  line-height: 2;
}
@media (min-width: 768px) {
  .skill-list {
    font-size: 1rem;
  }
}
.skill-name {
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--blog-primary);
}
.skill-items {
  color: color-mix(in srgb, var(--blog-foreground) 70%, transparent);
}

/* ===== 时间线 ===== */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.timeline-item {
  position: relative;
  padding-left: 2rem;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--blog-primary);
}
.timeline-item::after {
  content: '';
  position: absolute;
  left: 8px;
  top: 16px;
  width: 2px;
  height: calc(100% + 1.5rem);
  background: var(--blog-border);
}
.timeline-item:last-child::after {
  display: none;
}
.timeline-period {
  margin-bottom: 4px;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--blog-primary) 70%, transparent);
}
.timeline-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--blog-foreground);
}
@media (min-width: 768px) {
  .timeline-title {
    font-size: 1.125rem;
  }
}
.timeline-desc {
  margin-top: 4px;
  font-size: 0.875rem;
  color: var(--blog-muted-foreground);
}

/* ===== 联系方式 ===== */
.contact {
  padding-bottom: 80px;
}
.mail-link {
  color: var(--blog-primary);
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.2s ease;
}
.mail-link:hover {
  color: var(--blog-foreground);
}
.contact-signature {
  margin-top: 48px;
  text-align: right;
}
.contact-signature .signature {
  font-size: 1.125rem;
  color: color-mix(in srgb, var(--blog-primary) 70%, transparent);
}
</style>
