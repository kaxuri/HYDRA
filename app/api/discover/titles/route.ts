// app/api/discover/titles/route.ts
import { NextResponse } from "next/server"

const BASE = "https://api.imdbapi.dev/titles"

export async function GET(req: Request) {
  const url = new URL(req.url)

  const forward = new URL(BASE)
  url.searchParams.forEach((value, key) => {
    forward.searchParams.append(key, value)
  })

  if (!forward.searchParams.get("sortBy")) {
    forward.searchParams.set("sortBy", "SORT_BY_RELEASE_DATE")
  }
  if (!forward.searchParams.get("sortOrder")) {
    forward.searchParams.set("sortOrder", "DESC")
  }
  if (!forward.searchParams.get("limit")) {
    forward.searchParams.set("limit", "25")
  }

  try {
    const r = await fetch(forward.toString(), {
      cache: "no-store",
      headers: { accept: "application/json" },
    })

    const text = await r.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: "Upstream error", status: r.status, details: data ?? text.slice(0, 300) },
        { status: r.status }
      )
    }

    return NextResponse.json({
      titles: data?.titles ?? [],
      nextPageToken: data?.nextPageToken ?? null,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: "Fetch failed", message: e?.message ?? String(e) },
      { status: 500 }
    )
  }
}
