
import { NextResponse } from "next/server"

async function fetchJsonSafe(url: string) {
  const r = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  })

  const contentType = r.headers.get("content-type") || ""
  const raw = await r.text() 

  let data: any = null
  if (contentType.includes("application/json")) {
    try {
      data = JSON.parse(raw)
    } catch {
    }
  }

  return { ok: r.ok, status: r.status, contentType, raw, data }
}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const candidates = [
    `https://api.imdbapi.dev/titles/${encodeURIComponent(id)}`,
    `https://api.imdbapi.dev/titles?id=${encodeURIComponent(id)}`,
    `https://api.imdbapi.dev/titles?ids=${encodeURIComponent(id)}`,
  ]

  let lastError: any = null

  for (const url of candidates) {
    try {
      const { ok, status, data, raw, contentType } = await fetchJsonSafe(url)

      if (!ok) {
        lastError = { status, contentType, rawSnippet: raw.slice(0, 300) }
        continue
      }


      if (data?.title) {
        return NextResponse.json({ title: data.title })
      }

      if (Array.isArray(data?.titles) && data.titles.length > 0) {
        return NextResponse.json({ title: data.titles[0] })
      }

      if (data && typeof data === "object") {
        return NextResponse.json({ title: data })
      }


      lastError = { status, contentType, rawSnippet: raw.slice(0, 300) }
    } catch (e: any) {
      lastError = { message: e?.message ?? String(e) }
    }
  }

  return NextResponse.json(
    {
      error: "Unable to resolve title by id",
      details: lastError ?? "No upstream accepted",
    },
    { status: 502 }
  )
}
