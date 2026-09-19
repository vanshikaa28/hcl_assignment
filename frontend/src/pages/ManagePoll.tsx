import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { pollService, Poll, PollResults } from "@/services/poll"
import { useRealtimePoll } from "@/hooks/useRealtimePoll"
import { Sidebar } from "@/components/layout/Sidebar"
import { ResultsChart } from "@/components/results/ResultsChart"
import { LiveIndicator } from "@/components/results/LiveIndicator"
import { PollStatus } from "@/components/polls/PollStatus"
import { SharePollDialog } from "@/components/polls/SharePollDialog"
import { DeletePollDialog } from "@/components/polls/DeletePollDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Copy, Share2, XCircle, Trash2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { getShareURL, copyToClipboard } from "@/utils/helpers"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"

export function ManagePoll() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [initialResults, setInitialResults] = useState<PollResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShare, setShowShare] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [p, r] = await Promise.all([
        pollService.getById(id),
        pollService.getResults(id).catch(() => null),
      ])
      const pollData = (p as unknown as { poll?: Poll }).poll || (p as unknown as Poll)
      setPoll(pollData as Poll)
      setInitialResults(r)
    } catch {
      toast.error("Failed to load poll")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const { results, status } = useRealtimePoll(poll?.id ?? null, initialResults)
  const liveResults = results || initialResults

  const handleCopyLink = async () => {
    if (!poll) return
    const ok = await copyToClipboard(getShareURL(poll.shareCode))
    if (ok) {
      toast.success("Link copied!")
    } else {
      toast.error("Failed to copy")
    }
  }

  const handleClose = async () => {
    if (!poll) return
    setIsClosing(true)
    try {
      const updated = await pollService.close(poll.id)
      setPoll(updated)
      toast.success("Poll closed")
    } catch { 
      toast.error("Failed to close poll") 
    } finally { 
      setIsClosing(false)
      setShowClose(false) 
    }
  }

  const handleDelete = async () => {
    if (!poll) return
    setIsDeleting(true)
    try {
      await pollService.delete(poll.id)
      toast.success("Poll deleted")
      navigate("/dashboard")
    } catch { 
      toast.error("Failed to delete poll") 
    } finally { 
      setIsDeleting(false) 
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block"><Sidebar /></div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold">Manage Poll</h1>
          </div>

          {isLoading ? (
            <Card><CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </CardContent></Card>
          ) : poll ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PollStatus status={poll.status} />
                        <LiveIndicator status={status} />
                      </div>
                      <CardTitle className="text-xl">{poll.title}</CardTitle>
                      {poll.description && <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-muted p-3 flex items-center gap-2">
                    <code className="text-xs flex-1 truncate">{getShareURL(poll.shareCode)}</code>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(getShareURL(poll.shareCode), "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setShowShare(true)}>
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                    {poll.status === "active" && (
                      <Button variant="outline" onClick={() => setShowClose(true)} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                        <XCircle className="mr-2 h-4 w-4" /> Close Poll
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowDelete(true)} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Live Results */}
              <Card>
                <CardHeader><CardTitle className="text-base">Live Results</CardTitle></CardHeader>
                <CardContent>
                  {liveResults ? (
                    <ResultsChart
                      options={poll.options}
                      counts={liveResults.counts || {}}
                      totalVotes={liveResults.totalVotes || 0}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No votes yet. Share your poll link to start collecting responses.</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </main>

      {poll && (
        <SharePollDialog
          open={showShare}
          onOpenChange={setShowShare}
          shareCode={poll.shareCode}
          pollTitle={poll.title}
        />
      )}

      <DeletePollDialog
        poll={poll}
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <AlertDialog open={showClose} onOpenChange={setShowClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close poll?</AlertDialogTitle>
            <AlertDialogDescription>
              Closing this poll will permanently stop accepting new votes from your audience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClosing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={isClosing}>
              {isClosing ? "Closing..." : "Close Poll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
