// app/api/interests/route.ts
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic" // nie keszuj statycznie
export const revalidate = 0

const UPSTREAM = "https://api.imdbapi.dev/interests"

export async function GET() {
  try {
    const r = await fetch(UPSTREAM, {
      cache: "no-store",
      headers: { accept: "application/json" },
    })

    const contentType = r.headers.get("content-type") || ""
    const text = await r.text()

    let data: any = null
    if (contentType.includes("application/json")) {
      try {
        data = JSON.parse(text)
      } catch {
        data = null
      }
    }

    if (!r.ok) {
      // zwróć poprawny JSON nawet gdy upstream zepsuty/HTML
      return NextResponse.json(
        { interests: [], error: "Upstream error", status: r.status, details: data ?? text.slice(0, 300) },
        { status: r.status },
      )
    }

    // API bywa w dwóch formatach: { interests: [...] } lub bezpośrednio [...]
    const rawList = Array.isArray(data?.interests) ? data.interests : Array.isArray(data) ? data : []

    const normalized = rawList
      .map((i: any) => {
        const name = (i?.name ?? i?.title ?? i?.id ?? "").toString().trim()
        if (!name) return null
        return { id: name, name }
      })
      .filter(Boolean)

    // unikalne
    const uniq = Array.from(new Map(normalized.map((g: any) => [g.name, g])).values())

    return NextResponse.json({ interests: uniq })
  } catch (e: any) {
    // również zwróć JSON (nie HTML), żeby frontend NIE próbował parsować HTML-a
    return NextResponse.json(
      { interests: [], error: "Fetch failed", message: e?.message ?? String(e) },
      { status: 500 },
    )
  }
}
