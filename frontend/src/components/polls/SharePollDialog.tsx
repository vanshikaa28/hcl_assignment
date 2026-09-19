import { useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ExternalLink, Check } from "lucide-react"
import { getShareURL, copyToClipboard } from "@/utils/helpers"
import { toast } from "sonner"

interface SharePollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareCode: string
  pollTitle: string
}

export function SharePollDialog({ open, onOpenChange, shareCode, pollTitle }: SharePollDialogProps) {
  const [copied, setCopied] = useState(false)
  const shareURL = getShareURL(shareCode)

  const handleCopy = async () => {
    const ok = await copyToClipboard(shareURL)
    if (ok) {
      setCopied(true)
      toast.success("Link copied!")
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error("Failed to copy")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Poll</DialogTitle>
          <DialogDescription>{pollTitle}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link">
          <TabsList className="w-full">
            <TabsTrigger value="link" className="flex-1">Link</TabsTrigger>
            <TabsTrigger value="qr" className="flex-1">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Poll URL</Label>
              <div className="flex gap-2">
                <Input value={shareURL} readOnly className="flex-1 text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="outline" onClick={() => window.open(shareURL, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="flex flex-col items-center gap-4 pt-4">
            <div className="rounded-xl border p-4 bg-white">
              <QRCodeCanvas value={shareURL} size={200} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Scan this QR code to open the poll</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
