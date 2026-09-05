<script setup lang="ts">
useHead({ title: '修改密码 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const msg = ref('')
const msgType = ref<'ok' | 'err'>('ok')
const submitting = ref(false)

const submit = async () => {
  msg.value = ''
  if (form.newPassword.length < 6 || form.newPassword.length > 72) {
    msgType.value = 'err'
    msg.value = '新密码长度需在 6-72 位之间'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    msgType.value = 'err'
    msg.value = '两次输入的新密码不一致'
    return
  }
  submitting.value = true
  try {
    await apiFetch('/api/auth/password', {
      method: 'PUT',
      body: { oldPassword: form.oldPassword, newPassword: form.newPassword }
    })
    msgType.value = 'ok'
    msg.value = '密码已更新'
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (e: any) {
    msgType.value = 'err'
    msg.value = e?.data?.message || '修改失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="admin-wrap">
    <AdminNav />
    <div class="admin-head">
      <h1 class="admin-title font-serif-warm">修改密码</h1>
    </div>

    <form class="pwd-form" @submit.prevent="submit">
      <div class="field">
        <label class="field-label">旧密码</label>
        <input v-model="form.oldPassword" type="password" class="edit-input" placeholder="当前密码" required autocomplete="current-password" />
      </div>
      <div class="field">
        <label class="field-label">新密码（6-72 位）</label>
        <input v-model="form.newPassword" type="password" class="edit-input" placeholder="新密码" required autocomplete="new-password" />
      </div>
      <div class="field">
        <label class="field-label">确认新密码</label>
        <input v-model="form.confirmPassword" type="password" class="edit-input" placeholder="再次输入新密码" required autocomplete="new-password" />
      </div>
      <div class="form-actions">
        <button type="submit" class="admin-btn primary" :disabled="submitting">
          {{ submitting ? '提交中…' : '更新密码' }}
        </button>
        <span class="form-msg" :class="msgType">{{ msg }}</span>
      </div>
      <p class="form-note">更新后请牢记新密码；当前登录状态保持有效，无需重新登录。</p>
    </form>
  </main>
</template>

<style scoped>
.admin-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
.admin-head { margin-bottom: 24px; }
.admin-title { font-size: 1.75rem; color: var(--blog-foreground); }
.pwd-form {
  max-width: 420px; padding: 24px;
  border: 1px solid var(--blog-border); border-radius: var(--blog-radius-md);
  background: var(--blog-card);
  display: flex; flex-direction: column; gap: 16px;
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.8rem; color: var(--blog-muted-foreground); }
.edit-input {
  width: 100%; padding: 10px 14px; border: 1px solid var(--blog-border);
  border-radius: var(--blog-radius-sm); background: var(--blog-card);
  color: var(--blog-foreground); font-size: 0.95rem; box-sizing: border-box;
}
.edit-input:focus { outline: none; border-color: var(--blog-primary); }
.form-actions { display: flex; align-items: center; gap: 12px; }
.admin-btn {
  padding: 8px 16px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-sm);
  background: var(--blog-card); color: var(--blog-foreground); font-size: 0.875rem; cursor: pointer;
}
.admin-btn.primary { background: var(--blog-primary); color: #fff; border-color: transparent; }
.admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.form-msg { font-size: 0.85rem; }
.form-msg.ok { color: var(--blog-primary); }
.form-msg.err { color: #b91c1c; }
.form-note { font-size: 0.75rem; color: var(--blog-muted-foreground); margin: 0; }
</style>
