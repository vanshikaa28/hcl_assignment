import { useEffect, useRef, useState, useCallback } from "react"
import { WS_URL, WS_RECONNECT_DELAY_MS, WS_MAX_RECONNECT_ATTEMPTS } from "@/utils/constants"
import { PollResults } from "@/services/poll"

export type WsStatus = "connecting" | "connected" | "reconnecting" | "disconnected"

interface UseRealtimePollResult {
  results: PollResults | null
  status: WsStatus
}

export function useRealtimePoll(pollId: string | null, initial?: PollResults | null): UseRealtimePollResult {
  const [results, setResults] = useState<PollResults | null>(initial ?? null)
  const [status, setStatus] = useState<WsStatus>("connecting")
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!pollId || !mountedRef.current) return

    setStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting")

    const url = `${WS_URL}/ws/polls/${pollId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (!mountedRef.current) return
      reconnectAttemptsRef.current = 0
      setStatus("connected")
      console.log(`[WS] Connected to poll ${pollId}`)
    }

    ws.onmessage = (event) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(event.data) as PollResults
        if (data.type === "POLL_RESULTS_UPDATED" && data.pollId === pollId) {
          setResults(data)
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err)
      }
    }

    ws.onerror = (err) => {
      console.error("[WS] Error:", err)
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      console.log(`[WS] Connection closed for poll ${pollId}`)

      if (reconnectAttemptsRef.current < WS_MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++
        const delay = Math.min(WS_RECONNECT_DELAY_MS * reconnectAttemptsRef.current, 30000)
        setStatus("reconnecting")
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)
        reconnectTimerRef.current = setTimeout(connect, delay)
      } else {
        setStatus("disconnected")
        console.warn("[WS] Max reconnect attempts reached")
      }
    }
  }, [pollId])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // Prevent reconnect on intentional close
        wsRef.current.close()
      }
    }
  }, [connect])

  // Keep results in sync with initial prop changes
  useEffect(() => {
    if (initial) setResults(initial)
  }, [initial])

  return { results, status }
}
