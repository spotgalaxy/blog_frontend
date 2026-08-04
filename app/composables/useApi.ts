import type { FetchOptions } from 'ofetch'

export function useApi() {
  const token = useCookie('blog_token')

  const apiFetch = <T>(url: string, opts: FetchOptions<'json'> = {}) => {
    const headers: Record<string, string> = {
      ...(opts.headers as Record<string, string> | undefined)
    }
    if (token.value) headers.Authorization = `Bearer ${token.value}`
    return $fetch<T>(url, { ...opts, headers })
  }

  return { apiFetch, token }
}
