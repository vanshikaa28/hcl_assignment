export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080"

export const POLL_STATUS = {
  ACTIVE: "active",
  CLOSED: "closed",
} as const

export const WS_RECONNECT_DELAY_MS = 2000
export const WS_MAX_RECONNECT_ATTEMPTS = 10
export const VOTER_TOKEN_KEY = "pulsepoll_voter_token"
export const AUTH_TOKEN_KEY = "pulsepoll_auth_token"
