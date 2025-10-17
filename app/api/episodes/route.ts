import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imdbId = searchParams.get("imdbId")

  if (!imdbId) {
    return NextResponse.json({ error: "imdbId parameter is required" }, { status: 400 })
  }

  try {
    let allEpisodes: any[] = []
    let pageToken: string | null = null
    let pageCount = 0

    do {
      const url = new URL(`https://api.imdbapi.dev/titles/${imdbId}/episodes`)
      url.searchParams.set("pageSize", "50")
      if (pageToken) {
        url.searchParams.set("pageToken", pageToken)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error(`IMDb API responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data.episodes) && data.episodes.length > 0) {
        allEpisodes = [...allEpisodes, ...data.episodes]
      }

      pageToken = data.nextPageToken || null
      pageCount++

      if (pageCount > 20) break
    } while (pageToken)

    return NextResponse.json({ episodes: allEpisodes })
  } catch (error) {
    console.error("Error fetching episodes:", error)
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 })
  }
}
