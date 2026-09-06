<script setup lang="ts">
/**
 * GitHub OAuth 回调页：
 * 浏览器从 GitHub 带 ?code=&state= 回到这里，转发给后端换取评论者令牌，
 * 存入 cookie 后跳回登录前的页面。
 */
const route = useRoute()
const code = route.query.code as string | undefined
const state = route.query.state as string | undefined
const redirect = route.query.redirect as string | undefined

const errorMsg = ref('')

onMounted(async () => {
  if (!code || !state) {
    errorMsg.value = '缺少授权参数，请重新发起登录'
    return
  }
  try {
    const res = await $fetch<{ code: number; message: string; data: { token: string; redirect: string } }>(
      '/api/auth/github/callback',
      { method: 'POST', body: { code, state } }
    )
    const token = useCookie('blog_comment_token', { maxAge: 60 * 60 * 24 * 30 })
    token.value = res.data.token
    const target = redirect || res.data.redirect || '/'
    // 只允许站内路径，防开放重定向
    await navigateTo(target.startsWith('/') && !target.startsWith('//') ? target : '/', {
      replace: true
    })
  } catch (e: any) {
    errorMsg.value = e?.data?.message || '登录失败，请关闭本页重新发起评论登录'
  }
})
</script>

<template>
  <div class="gh-callback">
    <p v-if="errorMsg" class="gh-msg font-serif-warm">{{ errorMsg }}</p>
    <p v-else class="gh-msg font-serif-warm">GitHub 登录成功，正在返回…</p>
    <NuxtLink to="/" class="gh-home font-serif-warm">返回首页</NuxtLink>
  </div>
</template>

<style scoped>
.gh-callback {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.gh-msg {
  color: var(--blog-muted-foreground);
}
.gh-home {
  font-size: 0.9rem;
  color: var(--blog-primary);
  text-decoration: none;
}
</style>
