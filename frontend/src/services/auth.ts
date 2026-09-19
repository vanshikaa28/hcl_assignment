import { api } from "./api"
import { AUTH_TOKEN_KEY } from "@/utils/constants"

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const authService = {
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const result = await api.post<AuthResponse>("/auth/signup", { name, email, password })
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    return result
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await api.post<AuthResponse>("/auth/login", { email, password })
    localStorage.setItem(AUTH_TOKEN_KEY, result.token)
    return result
  },

  async me(): Promise<User> {
    return api.get<User>("/auth/me", true)
  },

  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  },

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem(AUTH_TOKEN_KEY)
  },
}
