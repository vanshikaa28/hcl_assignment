import { PollOption } from "@/services/poll"
import { ResultBar } from "./ResultBar"
import { VoteStats } from "./VoteStats"

interface ResultsChartProps {
  options: PollOption[]
  counts: Record<string, number>
  totalVotes: number
}

export function ResultsChart({ options, counts, totalVotes }: ResultsChartProps) {
  const maxCount = Math.max(...options.map((o) => counts[o.id] || 0), 0)

  return (
    <div className="space-y-4">
      <VoteStats totalVotes={totalVotes} />
      <div className="space-y-4">
        {options.map((option) => {
          const count = counts[option.id] || 0
          const isLeading = count === maxCount && count > 0
          return (
            <ResultBar
              key={option.id}
              label={option.text}
              count={count}
              total={totalVotes}
              isLeading={isLeading}
            />
          )
        })}
      </div>
    </div>
  )
}
