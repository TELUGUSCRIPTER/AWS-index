"use client"

import { useEffect, useRef, useState } from "react"
import { ShieldAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function ScanPopup({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setProgress(0)

    function tick() {
      setProgress((p) => {
        const inc = Math.min(100 - p, Math.max(3, Math.round(Math.random() * 10)))
        const next = p + inc
        if (next >= 100) {
          if (timerRef.current) window.clearInterval(timerRef.current)
          // Short delay then close, allowing the main scan to begin
          setTimeout(() => onOpenChange(false), 400)
        }
        return next
      })
    }

    timerRef.current = window.setInterval(tick, 150)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-green-900/50 bg-black/90 text-green-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-300">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            Scanning Your Device
          </DialogTitle>
          <DialogDescription className="text-green-400/80">
            Initializing diagnostics. This is a visual simulation for stylistic purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <ProgressBar value={progress} />
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-300">Collecting metadata...</span>
            <span className="tabular-nums text-green-400">{progress}%</span>
          </div>
        </div>

        <div className="mt-2 text-[10px] text-green-500/70">
          Data is displayed locally in your browser. No harmful actions are performed.
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded bg-green-950/40">
      <div
        className="h-full bg-green-500 transition-[width] duration-150 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-green-400/10 to-transparent" />
    </div>
  )
}
