"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export interface CreditPerson {
  name: {
    id: string
    displayName: string
    alternativeNames?: string[]
    primaryImage?: { url?: string; width?: number; height?: number }
    primaryProfessions?: string[]
  }
  category: string
  characters?: string[]
  episodeCount?: number
}

interface CastProps {
  imdbId: string
  className?: string
}

type CacheEntry = {
  list: CreditPerson[]
  nextPageToken: string | null
  total: number | null
}

export function Cast({ imdbId, className }: CastProps) {
  const [credits, setCredits] = useState<CreditPerson[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  const cache = useRef<Record<string, CacheEntry>>({})

  const dedupe = (arr: CreditPerson[]) => {
    const seen = new Set<string>()
    const out: CreditPerson[] = []
    for (const c of arr) {
      const key = `${c.category || "other"}::${c.name?.id || ""}`
      if (!seen.has(key)) {
        seen.add(key)
        out.push(c)
      }
    }
    return out
  }

  const extractTotal = (data: any): number | null => {
    const candidates = [
      data?.totalCredits,
      data?.total,
      data?.count,
      data?.pagination?.total,
      data?.meta?.total,
    ]
    for (const c of candidates) {
      if (typeof c === "number" && c >= 0) return c
    }
    return null
  }

  const fetchCreditsPage = async (token?: string | null) => {
    const base = `https://api.imdbapi.dev/titles/${encodeURIComponent(imdbId)}/credits`
    const url = token ? `${base}?pageToken=${encodeURIComponent(token)}` : base

    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      throw new Error(`Credits fetch failed: ${res.status}`)
    }
    const data = await res.json()

    // lista może siedzieć pod credits / cast / być tablicą
    const list: CreditPerson[] = Array.isArray(data?.credits)
      ? data.credits
      : Array.isArray(data?.cast)
      ? data.cast
      : Array.isArray(data)
      ? data
      : []

    const nextToken: string | null = data?.nextPageToken ?? null
    const totalCount: number | null = extractTotal(data)

    return { list, nextToken, totalCount }
  }

  useEffect(() => {
    if (!imdbId) return

    const run = async () => {
      const cached = cache.current[imdbId]
      if (cached) {
        setCredits(cached.list)
        setNextPageToken(cached.nextPageToken)
        setTotal(cached.total)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const { list, nextToken, totalCount } = await fetchCreditsPage(null)
        const unique = dedupe(list)
        setCredits(unique)
        setNextPageToken(nextToken)
        setTotal(totalCount)
        cache.current[imdbId] = { list: unique, nextPageToken: nextToken, total: totalCount }
      } catch (err: any) {
        console.error("Error fetching credits", err)
        setError(err?.message || "Failed to load cast")
        setCredits([])
        setNextPageToken(null)
        setTotal(null)
      } finally {
        setIsLoading(false)
      }
    }

    run()
  }, [imdbId])

  const loadMore = async () => {
    if (!nextPageToken || isLoadingMore) return
    setIsLoadingMore(true)
    setError(null)
    try {
      const { list, nextToken, totalCount } = await fetchCreditsPage(nextPageToken)
      const merged = dedupe([...credits, ...list])
      setCredits(merged)
      setNextPageToken(nextToken)
      // jeśli wcześniej total był nieznany, a teraz API go zwróciło — ustaw
      if (total === null && typeof totalCount === "number") setTotal(totalCount)
      cache.current[imdbId] = {
        list: merged,
        nextPageToken: nextToken,
        total: total ?? totalCount ?? null,
      }
    } catch (err: any) {
      console.error("Error fetching more credits", err)
      setError(err?.message || "Failed to load more cast")
    } finally {
      setIsLoadingMore(false)
    }
  }

  // grupowanie po kategorii
  const grouped = useMemo(() => {
    return credits.reduce<Record<string, CreditPerson[]>>((acc, c) => {
      const key = c.category || "other"
      if (!acc[key]) acc[key] = []
      acc[key].push(c)
      return acc
    }, {})
  }, [credits])

  if (!imdbId) {
    return (
      <Card className={`p-6 bg-card border-border ${className || ""}`}>
        <h3 className="text-xl font-semibold mb-2">Cast & Crew</h3>
        <p className="text-muted-foreground">Select a movie to view cast and crew.</p>
      </Card>
    )
  }

  const displayed = credits.length
  const totalLabel =
    typeof total === "number" ? `Displaying ${displayed} from ${total} Records` : `Displaying ${displayed} from ${displayed} Records` 

  return (
    <Card className={`p-6 bg-card border-border ${className || ""}`}>
      {/* Header: lewa nazwa, prawa licznik + Load more */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-xl font-semibold">Cast & Crew</h3>

        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">{totalLabel}</span>
          {nextPageToken && (
            <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
              {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-destructive mb-4">Failed to load cast: {error}</div>}

      {isLoading && !credits.length && <p className="text-muted-foreground">Loading...</p>}

      {!isLoading && credits.length === 0 && !error && (
        <p className="text-muted-foreground">No cast/crew data available.</p>
      )}

      {!isLoading && credits.length > 0 && (
        <div className="space-y-6">
          {Object.keys(grouped).map((category) => (
            <section key={category}>
              <h4 className="text-lg font-semibold mb-3 capitalize">{category}</h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {grouped[category].map((c) => (
                  <div key={`${category}::${c.name.id}`} className="flex flex-col items-center text-center">
                    <div className="w-full aspect-[2/3] bg-secondary rounded-md overflow-hidden flex items-center justify-center">
                      {c.name.primaryImage?.url ? (
                        <Image
                          width={400}
                          height={600}
                          src={c.name.primaryImage.url}
                          alt={c.name.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground">No image</div>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="font-medium text-sm line-clamp-2">{c.name.displayName}</div>
                      {c.characters && c.characters.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {c.characters.join(", ")}
                        </div>
                      )}
                      {typeof c.episodeCount === "number" && (
                        <div className="text-xs text-muted-foreground mt-1">{c.episodeCount} ep</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Card>
  )
}
