import { NextResponse } from "next/server"

const BASE = "https://api.imdbapi.dev/titles"
const CURRENT_YEAR = 2025
const MIN_VOTES = 100

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const forward = new URL(BASE)

  const passThroughParams = [
    "types",
    "genres",
    "countryCodes",
    "languageCodes",
    "nameIds",
    "interestIds",
    "startYear",
    "endYear",
    "minVoteCount",
    "maxVoteCount",
    "minAggregateRating",
    "maxAggregateRating",
    "sortBy",
    "sortOrder",
    "pageToken",
    "limit",
  ] as const

  // Przepuszczamy wartości
  for (const key of passThroughParams) {
    const values = searchParams.getAll(key)
    for (const v of values) forward.searchParams.append(key, v)
  }

  // Domyślne sortowanie (jeśli brak)
  if (!forward.searchParams.get("sortBy")) {
    forward.searchParams.set("sortBy", "SORT_BY_RELEASE_DATE")
  }
  if (!forward.searchParams.get("sortOrder")) {
    forward.searchParams.set("sortOrder", "DESC")
  }
  if (!forward.searchParams.get("limit")) {
    forward.searchParams.set("limit", "25")
  }

  // **Globalny limit roku** (max 2025)
  const endYear = Number(forward.searchParams.get("endYear") || CURRENT_YEAR)
  forward.searchParams.set("endYear", String(Math.min(endYear || CURRENT_YEAR, CURRENT_YEAR)))

  // **Globalny minVoteCount >= 100**
  const incomingMinVotes = Number(forward.searchParams.get("minVoteCount") || 0)
  const enforced = Math.max(incomingMinVotes || 0, MIN_VOTES)
  forward.searchParams.set("minVoteCount", String(enforced))

  try {
    const res = await fetch(forward.toString(), { cache: "no-store" })
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      // Przechwycenie błędów CORS/HTML itp.
      return NextResponse.json({ titles: [], nextPageToken: null, error: "Upstream returned non-JSON" }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({
      titles: data?.titles ?? [],
      nextPageToken: data?.nextPageToken ?? null,
    })
  } catch (e) {
    return NextResponse.json({ titles: [], nextPageToken: null, error: "Upstream error" }, { status: 500 })
  }
}
