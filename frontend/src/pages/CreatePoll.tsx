import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { pollService, Poll } from "@/services/poll"
import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SharePollDialog } from "@/components/polls/SharePollDialog"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

interface OptionRow {
  id: string
  text: string
}

export function CreatePoll() {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<OptionRow[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdPoll, setCreatedPoll] = useState<Poll | null>(null)
  const [showShare, setShowShare] = useState(false)

  const addOption = () => {
    if (options.length >= 10) return
    setOptions((prev) => [...prev, { id: Date.now().toString(), text: "" }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  const updateOption = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const filledOptions = options.filter((o) => o.text.trim())
    if (filledOptions.length < 2) {
      setError("Please provide at least 2 options")
      return
    }
    if (!title.trim()) {
      setError("Poll title is required")
      return
    }

    setIsLoading(true)
    try {
      const poll = await pollService.create({
        title: title.trim(),
        description: description.trim(),
        options: filledOptions.map((o) => ({ text: o.text.trim() })),
      })
      setCreatedPoll(poll)
      setShowShare(true)
      toast.success("Poll created successfully!")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create poll"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block"><Sidebar /></div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create a new poll</h1>
              <p className="text-muted-foreground text-sm">Build your question and customize options</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Poll Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Question *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Which backend framework do you prefer?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={300}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add more context or details for voters..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options</CardTitle>
                <CardDescription>Add 2 to 10 choices for your audience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <span className="flex h-10 w-8 items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                      {index + 1}
                    </span>
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      maxLength={200}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={options.length <= 2}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}

                {options.length < 10 && (
                  <Button type="button" variant="outline" className="w-full mt-2" onClick={addOption}>
                    <Plus className="mr-2 h-4 w-4" /> Add Option
                  </Button>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Poll"}
            </Button>
          </form>
        </div>
      </main>

      {createdPoll && (
        <SharePollDialog
          open={showShare}
          onOpenChange={(open) => {
            setShowShare(open)
            if (!open) navigate(`/polls/${createdPoll.id}/manage`)
          }}
          shareCode={createdPoll.shareCode}
          pollTitle={createdPoll.title}
        />
      )}
    </div>
  )
}
