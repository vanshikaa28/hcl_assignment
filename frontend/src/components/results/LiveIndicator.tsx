import { cn } from "@/lib/utils"
import { WsStatus } from "@/hooks/useRealtimePoll"

interface LiveIndicatorProps {
  status: WsStatus
  className?: string
}

export function LiveIndicator({ status, className }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-medium", className)}>
      {status === "connected" && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-green-600">Live</span>
        </>
      )}
      {status === "connecting" && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
          </span>
          <span className="text-yellow-600">Connecting...</span>
        </>
      )}
      {status === "reconnecting" && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-bounce absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
          <span className="text-orange-600">Reconnecting...</span>
        </>
      )}
      {status === "disconnected" && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
          </span>
          <span className="text-red-600">Offline</span>
        </>
      )}
    </div>
  )
}
