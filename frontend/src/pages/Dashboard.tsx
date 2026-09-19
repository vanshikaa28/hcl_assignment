import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { pollService, Poll } from "@/services/poll"
import { Sidebar } from "@/components/layout/Sidebar"
import { PollCard } from "@/components/polls/PollCard"
import { DeletePollDialog } from "@/components/polls/DeletePollDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, BarChart2, CheckCircle, Users } from "lucide-react"
import { toast } from "sonner"

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingPoll, setDeletingPoll] = useState<Poll | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPolls = useCallback(async () => {
    try {
      const data = await pollService.list()
      setPolls(data || [])
    } catch {
      toast.error("Failed to load polls")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadPolls() }, [loadPolls])

  const handleDelete = async () => {
    if (!deletingPoll) return
    setIsDeleting(true)
    try {
      await pollService.delete(deletingPoll.id)
      setPolls((prev) => prev.filter((p) => p.id !== deletingPoll.id))
      toast.success("Poll deleted")
      setDeletingPoll(null)
    } catch {
      toast.error("Failed to delete poll")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = async (poll: Poll) => {
    try {
      const updated = await pollService.close(poll.id)
      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      toast.success("Poll closed")
    } catch {
      toast.error("Failed to close poll")
    }
  }

  const activePollsCount = polls.filter((p) => p.status === "active").length

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{greeting()}, {user?.name?.split(" ")[0]}</h1>
              <p className="text-muted-foreground">Manage your polls and track live responses</p>
            </div>
            <Button onClick={() => navigate("/polls/create")}>
              <Plus className="mr-2 h-4 w-4" /> Create Poll
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={BarChart2} label="Total Polls" value={polls.length} />
            <StatCard icon={CheckCircle} label="Active Polls" value={activePollsCount} />
            <StatCard icon={Users} label="Poll Status" value={activePollsCount > 0 ? "Ready" : "Idle"} />
          </div>

          {/* Poll Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Polls</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}><CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </CardContent></Card>
                ))}
              </div>
            ) : polls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg">
                <BarChart2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold">No polls yet</h3>
                <p className="text-muted-foreground mb-6">Create your first poll and start collecting responses.</p>
                <Button onClick={() => navigate("/polls/create")}>
                  <Plus className="mr-2 h-4 w-4" /> Create Poll
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {polls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    onDelete={setDeletingPoll}
                    onClose={handleClose}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <DeletePollDialog
        poll={deletingPoll}
        open={!!deletingPoll}
        onOpenChange={(open) => !open && setDeletingPoll(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
