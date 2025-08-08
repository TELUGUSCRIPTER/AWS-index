"use client"

import { useEffect, useRef, useState } from "react"

export default function HackerTerminal({
  lines,
  speed = 20,
  startImmediately = true,
}: {
  lines: string[]
  speed?: number
  startImmediately?: boolean
}) {
  const [output, setOutput] = useState<string>("")
  const [started, setStarted] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!startImmediately || started) return
    setStarted(true)

    let idx = 0
    let line = 0
    let cancelled = false

    function typeNext() {
      if (cancelled) return
      if (line >= lines.length) return

      const target = lines[line]
      if (idx <= target.length) {
        setOutput((prev) => {
          const prevLines = prev.split("\n")
          prevLines[line] = target.slice(0, idx)
          return prevLines.slice(0, line).join("\n") + (line > 0 ? "\n" : "") + target.slice(0, idx)
        })
        idx++
        // Auto-scroll
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
        setTimeout(typeNext, speed)
      } else {
        // Finish line, append newline and go to next
        setOutput((prev) => (prev ? prev + "\n" : "") + target)
        line++
        idx = 0
        setTimeout(typeNext, Math.max(100, speed * 5))
      }
    }

    // Initialize with empty lines to avoid "undefined"
    setOutput("")
    setTimeout(typeNext, 300)

    return () => {
      cancelled = true
    }
  }, [lines, speed, startImmediately, started])

  return (
    <div ref={containerRef} className="max-h-96 overflow-auto">
      <pre className="whitespace-pre-wrap font-mono text-sm leading-6 text-green-300">
        {output}
        <span className="inline-block w-2 animate-pulse bg-green-400 align-middle" aria-hidden />
      </pre>
    </div>
  )
}
