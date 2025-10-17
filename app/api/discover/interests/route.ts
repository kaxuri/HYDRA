import { NextResponse } from "next/server"

const BASE = "https://api.imdbapi.dev/interests"

export async function GET() {
  try {
    const res = await fetch(BASE, { cache: "no-store" })
    const data = await res.json()
    return NextResponse.json({ interests: Array.isArray(data?.interests) ? data.interests : [] })
  } catch (e) {
    return NextResponse.json({ interests: [] }, { status: 500 })
  }
}
