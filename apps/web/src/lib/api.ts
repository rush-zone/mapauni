const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api/v1'

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: extraHeaders, ...restOptions } = options ?? {}
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...restOptions,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    fetchAPI<T>(path, { headers }),

  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    fetchAPI<T>(path, { method: 'POST', body: JSON.stringify(body), headers }),

  patch: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    fetchAPI<T>(path, { method: 'PATCH', body: JSON.stringify(body), headers }),
}
