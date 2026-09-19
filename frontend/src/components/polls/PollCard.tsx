import { Poll } from "@/services/poll"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PollStatus } from "./PollStatus"
import { BarChart2, Copy, ExternalLink, MoreHorizontal, Trash2, XCircle } from "lucide-react"
import { formatDate, getShareURL, copyToClipboard } from "@/utils/helpers"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"

interface PollCardProps {
  poll: Poll
  totalVotes?: number
  onDelete?: (poll: Poll) => void
  onClose?: (poll: Poll) => void
}

export function PollCard({ poll, totalVotes = 0, onDelete, onClose }: PollCardProps) {
  const navigate = useNavigate()

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(getShareURL(poll.shareCode))
    if (ok) toast.success("Link copied to clipboard")
    else toast.error("Failed to copy link")
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">{poll.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/polls/${poll.id}/manage`)}>
                <BarChart2 className="mr-2 h-4 w-4" /> Manage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(getShareURL(poll.shareCode), "_blank")}>
                <ExternalLink className="mr-2 h-4 w-4" /> Open poll
              </DropdownMenuItem>
              {poll.status === "active" && onClose && (
                <DropdownMenuItem onClick={() => onClose(poll)} className="text-orange-600">
                  <XCircle className="mr-2 h-4 w-4" /> Close poll
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(poll)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <PollStatus status={poll.status} />
          <div className="text-xs text-muted-foreground space-y-0.5 text-right">
            <div>{totalVotes} votes</div>
            <div>{formatDate(poll.createdAt)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
