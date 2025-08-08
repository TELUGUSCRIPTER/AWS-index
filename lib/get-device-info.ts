export type DeviceInfo = {
  userAgent: string
  os: { name: string; version?: string }
  browser: { name: string; version?: string }
  screen: { width: number; height: number; colorDepth: number; pixelRatio: number }
  input: { touch: boolean }
  locale: { language: string; timezone: string }
  privacy: { doNotTrack: boolean; cookiesEnabled: boolean; localStorage: boolean; sessionStorage: boolean }
  hardware: { cores?: number; memoryGB?: number }
  connection: { effectiveType?: string; downlinkMbps?: number; rttMs?: number; saveData?: boolean }
  battery: { level?: number; charging?: boolean }
  graphics: { renderer: string }
}

export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const nav = typeof navigator !== "undefined" ? navigator : ({} as Navigator)
  const win = typeof window !== "undefined" ? window : ({} as Window & typeof globalThis)

  // User agent
  const userAgent = nav.userAgent || ""

  // Basic parsers (lightweight)
  const os = parseOS(userAgent)
  const browser = parseBrowser(userAgent)

  // Screen
  const screenInfo = {
    width: win.screen?.width ?? 0,
    height: win.screen?.height ?? 0,
    colorDepth: win.screen?.colorDepth ?? 0,
    pixelRatio: (win.devicePixelRatio ?? 1) as number,
  }

  // Input
  const touch = "ontouchstart" in win || (nav as any).maxTouchPoints > 0

  // Locale
  const language = Array.isArray((nav as any).languages) && (nav as any).languages.length ? (nav as any).languages[0] : (nav.language ?? "en")
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC"

  // Privacy & Storage
  const doNotTrack = nav.doNotTrack === "1" || (nav as any).msDoNotTrack === "1"
  const cookiesEnabled = nav.cookieEnabled ?? false
  const localStorageOk = hasStorage(() => localStorage)
  const sessionStorageOk = hasStorage(() => sessionStorage)

  // Hardware
  const cores = (nav as any).hardwareConcurrency as number | undefined
  const memRaw = (nav as any).deviceMemory as number | undefined
  const memoryGB = memRaw ? Math.round(memRaw * 10) / 10 : undefined

  // Connection (experimental)
  const connection = (nav as any).connection || (nav as any).mozConnection || (nav as any).webkitConnection
  const effectiveType = connection?.effectiveType as string | undefined
  const downlinkMbps = typeof connection?.downlink === "number" ? Math.round(connection.downlink * 10) / 10 : undefined
  const rttMs = typeof connection?.rtt === "number" ? connection.rtt : undefined
  const saveData = !!connection?.saveData

  // Battery (may require permission on some platforms)
  let batteryLevel: number | undefined = undefined
  let charging: boolean | undefined = undefined
  try {
    const getBattery = (nav as any).getBattery as undefined | (() => Promise<any>)
    if (typeof getBattery === "function") {
      const b = await getBattery()
      batteryLevel = typeof b.level === "number" ? b.level : undefined
      charging = !!b.charging
    }
  } catch {
    // ignore
  }

  // Graphics renderer via WebGL
  const renderer = getWebGLRenderer()

  return {
    userAgent,
    os,
    browser,
    screen: screenInfo,
    input: { touch },
    locale: { language, timezone },
    privacy: { doNotTrack, cookiesEnabled, localStorage: localStorageOk, sessionStorage: sessionStorageOk },
    hardware: { cores, memoryGB },
    connection: { effectiveType, downlinkMbps, rttMs, saveData },
    battery: { level: batteryLevel, charging },
    graphics: { renderer },
  }
}

function hasStorage(getter: () => Storage) {
  try {
    const s = getter()
    const key = "__t"
    s.setItem(key, "1")
    s.removeItem(key)
    return true
  } catch {
    return false
  }
}

function parseOS(ua: string): { name: string; version?: string } {
  ua = ua || ""
  // Very rough detection; no external lib
  if (/Windows NT 10/.test(ua)) return { name: "Windows", version: "10" }
  if (/Windows NT 11/.test(ua)) return { name: "Windows", version: "11" }
  if (/Windows NT 6\.3/.test(ua)) return { name: "Windows", version: "8.1" }
  if (/Windows NT 6\.2/.test(ua)) return { name: "Windows", version: "8" }
  if (/Mac OS X (\d+[_\.]\d+([_\.]\d+)?)/.test(ua)) {
    const m = ua.match(/Mac OS X (\d+[_\.]\d+([_\.]\d+)?)/)
    return { name: "macOS", version: m?.[1]?.replaceAll("_", ".") }
  }
  if (/Android (\d+(\.\d+)?)/.test(ua)) {
    const m = ua.match(/Android (\d+(\.\d+)?)/)
    return { name: "Android", version: m?.[1] }
  }
  if (/(iPhone|iPad|iPod).*OS (\d+[_\.]\d+)/.test(ua)) {
    const m = ua.match(/OS (\d+[_\.]\d+)/)
    return { name: "iOS", version: m?.[1]?.replaceAll("_", ".") }
  }
  if (/Linux/.test(ua)) return { name: "Linux" }
  return { name: "Unknown" }
}

function parseBrowser(ua: string): { name: string; version?: string } {
  ua = ua || ""
  // Order matters
  const re = [
    { n: "Edge", r: /Edg\/([\d.]+)/ },
    { n: "Chrome", r: /Chrome\/([\d.]+)/ },
    { n: "Firefox", r: /Firefox\/([\d.]+)/ },
    { n: "Safari", r: /Version\/([\d.]+).*Safari/ },
  ]
  for (const { n, r } of re) {
    const m = ua.match(r)
    if (m) return { name: n, version: m[1] }
  }
  return { name: "Unknown" }
}

function getWebGLRenderer(): string {
  try {
    const canvas = document.createElement("canvas")
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null)
    if (!gl) return "N/A"
    const ext = gl.getExtension("WEBGL_debug_renderer_info")
    if (ext) {
      const renderer = gl.getParameter((ext as any).UNMASKED_RENDERER_WEBGL)
      return String(renderer)
    }
    return "Hidden"
  } catch {
    return "N/A"
  }
}
