"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Check, Copy, Download, TerminalSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import MatrixRain from "@/components/matrix-rain"
import { collectDeviceInfo, type DeviceInfo } from "@/lib/get-device-info"
import MalwarePopup from "@/components/malware-popup"
import ScanPopup from "@/components/scan-popup"

type VisitorInfo = {
  ip?: string
  city?: string
  region?: string
  country_name?: string
  latitude?: number
  longitude?: number
  org?: string
  asn?: string | number
  timezone?: string
  postal?: string
  version?: string
  country_code?: string
  network?: string
  error?: string
}

type RevealItem =
  | { kind: "heading"; text: string }
  | { kind: "kv"; label: string; value: string; mono?: boolean }

export default function Page() {
  const [visitor, setVisitor] = useState<VisitorInfo | null>(null)
  const [device, setDevice] = useState<DeviceInfo | null>(null)

  const [copyOk, setCopyOk] = useState(false)
  const [scanStarted, setScanStarted] = useState(false)
  const [scanDone, setScanDone] = useState(false)
  const [revealed, setRevealed] = useState<RevealItem[]>([])

  const [showScanPopup, setShowScanPopup] = useState(true)
  const [showMalware, setShowMalware] = useState(false)

  const runIdRef = useRef(0)

  // Begin scanning only after the initial scan popup closes
  useEffect(() => {
    if (!showScanPopup && !scanStarted) {
      runScan()
    }
  }, [showScanPopup, scanStarted])

  // Reveal helpers
  function kv(label: string, value: string, mono?: boolean): RevealItem | null {
    if (!value) return null
    return { kind: "kv", label, value, mono }
  }
  function divider(): RevealItem {
    return { kind: "heading", text: "—" }
  }
  function buildDeviceItems(d: DeviceInfo): RevealItem[] {
    const arr: (RevealItem | null)[] = [
      { kind: "heading", text: "Device" },
      kv("OS", d.os.name ? `${d.os.name} ${d.os.version ?? ""}`.trim() : ""),
      kv("Browser", d.browser.name ? `${d.browser.name} ${d.browser.version ?? ""}`.trim() : ""),
      kv("User Agent", d.userAgent, true),
      divider(),
      kv("Screen", `${d.screen.width}×${d.screen.height} @${d.screen.pixelRatio}x`),
      kv("Color Depth", `${d.screen.colorDepth}-bit`),
      kv("Touch", d.input.touch ? "Yes" : "No"),
      kv("Language", d.locale.language),
      kv("Timezone", d.locale.timezone),
      kv("Do Not Track", d.privacy.doNotTrack ? "On" : "Off"),
      divider(),
      kv("Cores", d.hardware.cores?.toString() ?? ""),
      kv("Memory", d.hardware.memoryGB != null ? `${d.hardware.memoryGB} GB` : ""),
      kv("GPU", d.graphics.renderer),
    ]
    return arr.filter(Boolean) as RevealItem[]
  }
  function buildConnPowerItems(d: DeviceInfo): RevealItem[] {
    const arr: (RevealItem | null)[] = [
      { kind: "heading", text: "Connection & Power" },
      kv("Type", d.connection.effectiveType ?? ""),
      kv("Downlink", d.connection.downlinkMbps != null ? `${d.connection.downlinkMbps} Mbps` : ""),
      kv("RTT", d.connection.rttMs != null ? `${d.connection.rttMs} ms` : ""),
      kv("Save Data", d.connection.saveData ? "Yes" : "No"),
      divider(),
      kv(
        "Battery",
        d.battery.level != null ? `${Math.round(d.battery.level * 100)}% ${d.battery.charging ? "(Charging)" : ""}` : "N/A",
      ),
      divider(),
      kv("Cookies", d.privacy.cookiesEnabled ? "Enabled" : "Disabled"),
      kv("LocalStorage", d.privacy.localStorage ? "Available" : "Unavailable"),
      kv("SessionStorage", d.privacy.sessionStorage ? "Available" : "Unavailable"),
    ]
    return arr.filter(Boolean) as RevealItem[]
  }
  function buildNetworkItems(v: VisitorInfo): RevealItem[] {
    if (v.error) {
      return [{ kind: "heading", text: "Network" }, { kind: "kv", label: "Status", value: `Error: ${v.error}` }]
    }
    const arr: (RevealItem | null)[] = [
      { kind: "heading", text: "Network" },
      kv("IP", v.ip ?? ""),
      kv("ISP/Org", v.org ?? ""),
      kv("ASN", v.asn != null ? String(v.asn) : ""),
      kv("City", v.city ?? ""),
      kv("Region", v.region ?? ""),
      kv("Country", [v.country_name, v.country_code].filter(Boolean).join(" / ")),
      kv("Coords", v.latitude != null && v.longitude != null ? `${v.latitude}, ${v.longitude}` : ""),
      kv("Timezone", v.timezone ?? ""),
      kv("Postal", v.postal ?? ""),
      kv("Network", v.network ?? ""),
    ]
    return arr.filter(Boolean) as RevealItem[]
  }

  async function runScan() {
    const myRunId = ++runIdRef.current
    setScanStarted(true)
    setScanDone(false)
    setRevealed([])

    try {
      // 1) Device info
      const deviceInfo = await collectDeviceInfo()
      if (runIdRef.current !== myRunId) return
      setDevice(deviceInfo)
      await revealSequence(buildDeviceItems(deviceInfo), myRunId, 280)

      // 2) Connection/Power
      await revealSequence(buildConnPowerItems(deviceInfo), myRunId, 280)

      // 3) Network info
      const res = await fetch("/api/visitor", { cache: "no-store" })
      const data = (await res.json()) as VisitorInfo
      if (runIdRef.current !== myRunId) return
      setVisitor(data)
      await revealSequence(buildNetworkItems(data), myRunId, 280)
    } catch (e) {
      console.error(e)
      const fallback: VisitorInfo = { error: "Failed to fetch IP information" }
      setVisitor(fallback)
      await revealSequence(buildNetworkItems(fallback), myRunId, 280)
    } finally {
      if (runIdRef.current === myRunId) {
        setScanDone(true)
        // Show final "malware injecting" simulation strictly after everything is revealed
        setTimeout(() => setShowMalware(true), 900)
      }
    }
  }

  async function revealSequence(items: RevealItem[], runId: number, delayMs = 260) {
    for (const item of items) {
      if (runIdRef.current !== runId) return
      setRevealed((prev) => [...prev, item])
      await sleep(delayMs)
    }
  }
  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
  }

  async function handleCopy() {
    const payload = JSON.stringify({ visitor, device }, null, 2)
    try {
      await navigator.clipboard.writeText(payload)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 1500)
    } catch (e) {
      console.error("Copy failed", e)
    }
  }
  function handleDownload() {
    const payload = JSON.stringify({ visitor, device }, null, 2)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const namePart = visitor?.ip ? visitor.ip.replaceAll(":", "-") : "visitor"
    a.download = `diagnostics-${namePart}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Turn these labels red after full scan completes
  const criticalLabels = new Set(["IP", "Coords", "Do Not Track", "Cookies", "LocalStorage", "SessionStorage", "Battery"])

  return (
    <main className="relative min-h-screen text-green-400">
      <MatrixRain />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="w-full border-b border-green-900/50 bg-black/70 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <TerminalSquare className="h-6 w-6 text-green-500" aria-hidden />
              <h1 className="text-lg font-semibold tracking-wider text-green-300">
                ACCESS PORTAL
                <span className="ml-2 inline-block h-5 w-[2px] animate-pulse bg-green-400 align-middle" aria-hidden />
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="border-green-900/50 bg-black/60 text-green-300 hover:bg-green-900/20 hover:text-green-200"
                    >
                      {copyOk ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy JSON
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="border-green-900/50 bg-black text-green-300">
                    Copy full diagnostics to clipboard
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-green-900/50 bg-black/60 text-green-300 hover:bg-green-900/20 hover:text-green-200"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </header>

        {/* Diagnostics */}
        <section className="flex-1 bg-black/60">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <Card className="border-green-900/50 bg-black/60 text-green-300">
              <CardHeader className="border-b border-green-900/50">
                <CardTitle className="text-green-200">Diagnostics</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[70vh]">
                  <div className="space-y-2 p-4">
                    {revealed.length === 0 && <div className="text-sm text-green-500/70">Initializing scanner...</div>}
                    {revealed.map((item, idx) =>
                      item.kind === "heading" ? (
                        item.text === "—" ? (
                          <Separator key={`sep-${idx}`} className="my-3 bg-green-900/50" />
                        ) : (
                          <SectionHeader key={`h-${idx}`} text={item.text} />
                        )
                      ) : (
                        <DataRow
                          key={`kv-${idx}-${item.label}`}
                          k={item.label}
                          v={item.value}
                          mono={item.mono}
                          highlight={scanDone && criticalLabels.has(item.label)}
                        />
                      ),
                    )}
                    {visitor?.error && (
                      <div className="mt-2 flex items-start gap-2 text-amber-400">
                        <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
                        <p>{visitor.error}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="border-t border-green-900/50 bg-black/70 px-4 py-3 text-center text-xs text-green-500">
          Visual simulation for aesthetic purposes. No harmful actions are performed.
        </footer>
      </div>

      {/* Initial Scan Popup */}
      <ScanPopup open={showScanPopup} onOpenChange={setShowScanPopup} />

      {/* Final simulation popup after all data is shown */}
      <MalwarePopup open={showMalware} onOpenChange={setShowMalware} notifyHandle="teluguscripter" />

      <GlowCSS />
    </main>
  )
}

function SectionHeader({ text }: { text: string }) {
  return <div className="mt-3 text-xs uppercase tracking-widest text-green-400/80">{text}</div>
}

function DataRow({
  k,
  v,
  mono,
  highlight,
}: {
  k: string
  v: string
  mono?: boolean
  highlight?: boolean
}) {
  // Slow typing effect
  const [typed, setTyped] = useState("")
  const [visible, setVisible] = useState(false)
  // Adaptive typing speed (slower overall)
  const speed = Math.max(14, Math.min(36, Math.floor(320 / Math.max(10, v.length))))

  useEffect(() => {
    let i = 0
    let cancelled = false
    setVisible(true)
    function step() {
      if (cancelled) return
      if (i <= v.length) {
        setTyped(v.slice(0, i))
        i++
        setTimeout(step, speed)
      }
    }
    const t = setTimeout(step, 120) // slight stagger
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [v, speed])

  return (
    <div
      className={`flex items-start gap-3 transition-all duration-400 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
    >
      <div className={`min-w-28 shrink-0 ${highlight ? "text-red-500" : "text-green-500"}`}>{k}</div>
      <div className={`grow ${mono ? "font-mono text-xs" : ""} ${highlight ? "text-red-400" : ""}`}>
        {typed}
        <span
          className={`inline-block w-1.5 translate-y-0.5 animate-pulse ${
            highlight ? "bg-red-400/80" : "bg-green-400/70"
          } align-middle`}
          aria-hidden
        />
      </div>
    </div>
  )
}

// Extra subtle neon glow without editing globals
function GlowCSS() {
  return (
    <style>{`
      :root { color-scheme: dark; }
      .neon {
        text-shadow:
          0 0 6px rgba(34,197,94,0.6),
          0 0 16px rgba(34,197,94,0.4),
          0 0 28px rgba(34,197,94,0.2);
      }
    `}</style>
  )
}
