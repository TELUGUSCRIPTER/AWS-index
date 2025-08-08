export async function GET() {
  // Using ipapi.co (no API key required for basic fields)
  // You may switch to another provider if rate-limited:
  // - https://api.ipify.org?format=json (IP only)
  // - https://get.geojs.io/v1/ip/geo.json
  try {
    const res = await fetch("https://ipapi.co/json/", {
      // Avoid caching to reflect real-time visitor IP
      cache: "no-store",
      // Some providers require a UA to avoid bot blocks
      headers: { "User-Agent": "v0-hacker-ui/1.0" },
    })
    if (!res.ok) {
      return Response.json({ error: `Provider error: ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return Response.json(data)
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Failed to fetch IP" }, { status: 500 })
  }
}
