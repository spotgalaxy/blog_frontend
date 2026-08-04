export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('blog_token')
  if (!token.value && to.path !== '/admin/login') {
    return navigateTo('/admin/login')
  }
})
