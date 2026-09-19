import { useState, useEffect, useCallback } from "react"
import { pollService, Poll, PollResults } from "@/services/poll"

export function usePoll(id: string | null) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPoll = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const [p, r] = await Promise.all([
        pollService.getPublic(id),
        pollService.getPublicResults(id).catch(() => null),
      ])
      setPoll(p)
      setResults(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load poll")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchPoll() }, [fetchPoll])

  return { poll, results, isLoading, error, refetch: fetchPoll }
}
