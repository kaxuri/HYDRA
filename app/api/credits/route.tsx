import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imdbId = searchParams.get("imdbId")

  if (!imdbId) {
    return NextResponse.json({ error: "imdbId parameter is required" }, { status: 400 })
  }

  try {
    let allCredits: any[] = []
    let pageToken: string | null = null
    let pageCount = 0

    do {
      const url = new URL(`https://api.imdbapi.dev/titles/${encodeURIComponent(imdbId)}/credits`)
      // jeśli API obsługuje pageSize — pobieramy większe paczki; jeśli nie, po prostu zignoruje
      url.searchParams.set("pageSize", "50")
      if (pageToken) {
        url.searchParams.set("pageToken", pageToken)
      }

      const response = await fetch(url.toString(), { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`IMDb API responded with status: ${response.status}`)
      }

      const data = await response.json()

      const chunk: any[] = Array.isArray(data?.credits)
        ? data.credits
        : Array.isArray(data?.cast)
        ? data.cast
        : Array.isArray(data)
        ? data
        : []

      if (chunk.length > 0) {
        allCredits = allCredits.concat(chunk)
      }

      pageToken = data?.nextPageToken || null
      pageCount += 1

      if (pageCount > 50) break
    } while (pageToken)

    const seen = new Set<string>()
    const unique = allCredits.filter((c) => {
      const key = `${c?.category || "other"}::${c?.name?.id || ""}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ credits: unique })
  } catch (error) {
    console.error("Error fetching credits:", error)
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
  }
}
