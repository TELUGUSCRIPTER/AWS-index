"use client"

import { useEffect, useRef } from "react"

export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId = 0
    let running = true

    const dpr = Math.max(1, Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1))
    const fontSize = 16
    let columns = 0
    let drops: number[] = []

    const chars = "01#@$%&*+-/\\|<>[]{}"
    const mql = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
    if (mql?.matches) return // respect reduced motion

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      columns = Math.ceil(w / fontSize)
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50))
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
    }

    function draw() {
      if (!running) return
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      // Fade the canvas to create trails
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)"
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length))
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillStyle = "#22c55e" // green-500
        ctx.fillText(text, x, y)

        // Reset drop
        if (y > h && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
      animationId = requestAnimationFrame(draw)
    }

    function start() {
      resize()
      draw()
      window.addEventListener("resize", resize)
    }

    function stop() {
      running = false
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }

    start()
    cleanupRef.current = stop
    return stop
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-black"
    />
  )
}
