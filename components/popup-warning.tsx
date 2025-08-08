"use client"

import { Dispatch, SetStateAction } from "react"
import { AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function PopupWarning({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-green-900/50 bg-black/90 text-green-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-300">
            <AlertCircle className="h-5 w-5" aria-hidden />
            Security Advisory
          </DialogTitle>
          <DialogDescription className="text-green-400/80">
            This interface simulates a security diagnostics console. By proceeding you consent to display of your device
            metadata on-screen.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            className="border-green-900/50 bg-black/60 text-green-300 hover:bg-green-900/20 hover:text-green-100"
            onClick={() => onOpenChange(false)}
          >
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
