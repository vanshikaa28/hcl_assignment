import { Progress } from "@/components/ui/progress"
import { formatPercent } from "@/utils/helpers"

interface ResultBarProps {
  label: string
  count: number
  total: number
  isLeading?: boolean
}

export function ResultBar({ label, count, total, isLeading }: ResultBarProps) {
  const percent = total === 0 ? 0 : Math.round((count / total) * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${isLeading ? "text-primary" : "text-foreground"}`}>
          {label}
          {isLeading && <span className="ml-1.5 text-xs text-primary">● Leading</span>}
        </span>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="font-semibold text-foreground">{count}</span>
          <span className="w-10 text-right">{formatPercent(count, total)}</span>
        </div>
      </div>
      <Progress value={percent} className="h-2.5" />
    </div>
  )
}
