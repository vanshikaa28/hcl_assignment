import { VOTER_TOKEN_KEY } from "./constants"

export function getVoterToken(): string {
  let token = localStorage.getItem(VOTER_TOKEN_KEY)
  if (!token) {
    token = generateToken()
    localStorage.setItem(VOTER_TOKEN_KEY, token)
  }
  return token
}

function generateToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return "0%"
  return `${Math.round((value / total) * 100)}%`
}

export function getShareURL(shareCode: string): string {
  return `${window.location.origin}/p/${shareCode}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
