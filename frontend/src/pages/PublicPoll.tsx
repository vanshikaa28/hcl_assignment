import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { pollService, Poll, PollResults } from "@/services/poll"
import { useRealtimePoll } from "@/hooks/useRealtimePoll"
import { LiveIndicator } from "@/components/results/LiveIndicator"
import { ResultsChart } from "@/components/results/ResultsChart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, AlertCircle, BarChart2 } from "lucide-react"
import { toast } from "sonner"

export function PublicPoll() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [initialResults, setInitialResults] = useState<PollResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState("")
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    if (!shareCode) return
    const load = async () => {
      try {
        const [p, r] = await Promise.all([
          pollService.getPublic(shareCode),
          pollService.getPublicResults(shareCode).catch(() => null),
        ])
        setPoll(p)
        setInitialResults(r)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Poll not found")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [shareCode])

  const { results, status } = useRealtimePoll(poll?.id ?? null, initialResults)
  const liveResults = results || initialResults

  const handleVote = async () => {
    if (!poll || !selectedOption) return
    setIsVoting(true)
    try {
      const result = await pollService.vote(poll.id, selectedOption)
      setInitialResults(result)
      setHasVoted(true)
      toast.success("Vote submitted!")
    } catch (err) {
      const e = err as Error & { code?: string }
      if (e.code === "ALREADY_VOTED") {
        setHasVoted(true)
        toast.info("You've already voted on this poll")
      } else if (e.code === "POLL_CLOSED") {
        toast.error("This poll is closed")
        setPoll((p) => (p ? { ...p, status: "closed" } : p))
      } else {
        toast.error(e.message || "Failed to submit vote")
      }
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loadError || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Poll not found</h2>
            <p className="text-muted-foreground text-sm mt-1">{loadError || "This poll doesn't exist or is unavailable."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {poll.status === "active" ? (
                    <Badge variant="live">● Live Poll</Badge>
                  ) : (
                    <Badge variant="secondary">Closed</Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{poll.title}</CardTitle>
                {poll.description && <CardDescription className="mt-1">{poll.description}</CardDescription>}
              </div>
              <LiveIndicator status={status} />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {hasVoted || poll.status === "closed" ? (
              <div>
                {hasVoted && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-5">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Vote submitted</p>
                      <p className="text-xs text-green-600">Your response has been recorded.</p>
                    </div>
                  </div>
                )}
                {liveResults && (
                  <ResultsChart
                    options={poll.options}
                    counts={liveResults.counts || {}}
                    totalVotes={liveResults.totalVotes || 0}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                  {poll.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        selectedOption === opt.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                      }`}
                      onClick={() => setSelectedOption(opt.id)}
                    >
                      <RadioGroupItem value={opt.id} id={opt.id} />
                      <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-medium text-base">
                        {opt.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedOption || isVoting}
                  onClick={handleVote}
                >
                  {isVoting ? "Submitting..." : "Submit Vote"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>Results update live • PulsePoll</span>
          {shareCode && (
            <Link to={`/p/${shareCode}/results`} className="flex items-center gap-1 hover:text-primary">
              <BarChart2 className="h-3.5 w-3.5" /> Full Results
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
