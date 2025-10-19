
import { NextResponse } from "next/server"

export const revalidate = 3600 // cache ISR 1h

export async function GET() {
  try {
    const url = new URL("https://api.imdbapi.dev/titles")
    url.searchParams.set("startYear", "2025")
    url.searchParams.set("pageSize", "20")
    // url.searchParams.set("sort", "startYear,desc")

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    })
    if (!res.ok) {
      return NextResponse.json({ titles: [] }, { status: res.status })
    }

    const data = await res.json()
    const titles = Array.isArray(data?.titles) ? data.titles : []

    const moviesOnly = titles.filter((t: any) => t?.type === "movie")
    const first10 = (moviesOnly.length ? moviesOnly : titles).slice(0, 10)

    return NextResponse.json({ titles: first10 })
  } catch (e) {
    console.error("Latest API error:", e)
    return NextResponse.json({ titles: [] }, { status: 200 })
  }
}
