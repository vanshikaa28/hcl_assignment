import { API_URL, AUTH_TOKEN_KEY } from "@/utils/constants"

interface ApiOptions extends RequestInit {
  auth?: boolean
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = false, ...fetchOptions } = options

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
  }

  if (auth) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    const message = data?.error?.message || "An error occurred"
    const code = data?.error?.code || "UNKNOWN_ERROR"
    const err = new Error(message) as Error & { code: string; status: number }
    err.code = code
    err.status = response.status
    throw err
  }

  return data.data as T
}

export const api = {
  get: <T>(path: string, auth = false) =>
    request<T>(path, { method: "GET", auth }),

  post: <T>(path: string, body: unknown, auth = false) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      auth,
    }),

  patch: <T>(path: string, body: unknown, auth = false) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      auth,
    }),

  delete: <T>(path: string, auth = false) =>
    request<T>(path, { method: "DELETE", auth }),
}
