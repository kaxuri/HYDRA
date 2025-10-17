// components/cast.tsx
"use client"

import React, { useEffect, useState, useRef } from "react"
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
  imdbId: string // e.g. "tt13159924"
  className?: string
}

export function Cast({ imdbId, className }: CastProps) {
  const [credits, setCredits] = useState<CreditPerson[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cache = useRef<Record<string, CreditPerson[]>>({})

  useEffect(() => {
    if (!imdbId) return

    const fetchCredits = async () => {
      if (cache.current[imdbId]) {
        setCredits(cache.current[imdbId])
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`https://api.imdbapi.dev/titles/${encodeURIComponent(imdbId)}/credits`)
        if (!res.ok) {
          throw new Error(`Credits fetch failed: ${res.status}`)
        }
        const data = await res.json()
        const list: CreditPerson[] = Array.isArray(data.credits) ? data.credits : []
        cache.current[imdbId] = list
        setCredits(list)
      } catch (err: any) {
        console.error("Error fetching credits", err)
        setError(err?.message || "Failed to load cast")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCredits()
  }, [imdbId])

  // group by category (actor, director, writer, etc.)
  const grouped = credits.reduce<Record<string, CreditPerson[]>>((acc, c) => {
    const key = c.category || "other"
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  if (!imdbId) {
    return (
      <Card className={`p-6 bg-card border-border ${className || ""}`}>
        <h3 className="text-xl font-semibold mb-2">Cast & Crew</h3>
        <p className="text-muted-foreground">Select a movie to view cast and crew.</p>
      </Card>
    )
  }

  return (
    <Card className={`p-6 bg-card border-border ${className || ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Cast & Crew</h3>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <div className="text-sm text-destructive mb-4">
          Failed to load cast: {error}
        </div>
      )}

      {isLoading && !credits.length && <p className="text-muted-foreground">Loading...</p>}

      {!isLoading && !credits.length && !error && (
        <p className="text-muted-foreground">No cast/crew data available.</p>
      )}

      {!isLoading && credits.length > 0 && (
        <div className="space-y-6">
          {Object.keys(grouped).map((category) => (
            <section key={category}>
              <h4 className="text-lg font-semibold mb-3 capitalize">{category}</h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {grouped[category].map((c) => (
                  <div key={c.name.id} className="flex flex-col items-center text-center">
                    <div className="w-full aspect-[2/3] bg-secondary rounded-md overflow-hidden flex items-center justify-center">
                      {c.name.primaryImage?.url ? (
                        // use the provided image; fallback to placeholder
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
