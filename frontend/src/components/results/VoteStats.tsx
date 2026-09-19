import { Users } from "lucide-react"

interface VoteStatsProps {
  totalVotes: number
}

export function VoteStats({ totalVotes }: VoteStatsProps) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Users className="h-4 w-4" />
      <span className="text-sm">
        <span className="font-semibold text-foreground">{totalVotes}</span>{" "}
        {totalVotes === 1 ? "vote" : "votes"} total
      </span>
    </div>
  )
}
