import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { pollService, Poll, PollResults } from "@/services/poll"
import { useRealtimePoll } from "@/hooks/useRealtimePoll"
import { LiveIndicator } from "@/components/results/LiveIndicator"
import { ResultsChart } from "@/components/results/ResultsChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getShareURL } from "@/utils/helpers"

export function Results() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [initialResults, setInitialResults] = useState<PollResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!shareCode) return
    Promise.all([
      pollService.getPublic(shareCode),
      pollService.getPublicResults(shareCode).catch(() => null),
    ])
      .then(([p, r]) => {
        setPoll(p)
        setInitialResults(r)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [shareCode])

  const { results, status } = useRealtimePoll(poll?.id ?? null, initialResults)
  const liveResults = results || initialResults

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-8 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm text-center p-8">
          <p className="text-muted-foreground">Poll not found</p>
          <Button className="mt-4" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/p/${shareCode}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Poll
            </Link>
          </Button>
          <LiveIndicator status={status} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="mb-2">
                  {poll.status === "active" ? (
                    <Badge variant="live">● Live Results</Badge>
                  ) : (
                    <Badge variant="secondary">Final Results</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{poll.title}</CardTitle>
                {poll.description && (
                  <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {liveResults ? (
              <ResultsChart
                options={poll.options}
                counts={liveResults.counts || {}}
                totalVotes={liveResults.totalVotes || 0}
              />
            ) : (
              <p className="text-muted-foreground text-sm">No votes yet</p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-center">
          {poll.status === "active" && (
            <Button asChild className="w-full">
              <a href={getShareURL(poll.shareCode)} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Vote on this Poll
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
