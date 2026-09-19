import { Badge } from "@/components/ui/badge"

interface PollStatusProps {
  status: "active" | "closed"
}

export function PollStatus({ status }: PollStatusProps) {
  if (status === "active") {
    return <Badge variant="live">● Live</Badge>
  }
  return <Badge variant="secondary">Closed</Badge>
}
