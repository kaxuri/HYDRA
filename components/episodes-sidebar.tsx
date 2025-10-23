"use client"

import { useMemo, useState, useEffect } from "react"
import { Loader2, ChevronDown } from "lucide-react"

export interface Episode {
  id: string
  season: number | string
  episodeNumber: number
  title?: string
  primaryTitle?: string
  runtimeSeconds?: number
  plot?: string
}

interface EpisodesSidebarProps {
  episodes: Episode[]
  selectedEpisode: { season: number; episode: number } | null
  onEpisodeSelect?: (season: number, episode: number) => void
  isLoading?: boolean
  className?: string
}

export default function EpisodesSidebar({
  episodes,
  selectedEpisode,
  onEpisodeSelect,
  isLoading,
  className,
}: EpisodesSidebarProps) {
  const seasons = useMemo(() => {
    const map = new Map<number, Episode[]>()
    for (const ep of episodes || []) {
      const s =
        typeof ep.season === "string" ? parseInt(ep.season, 10) || 1 : ep.season || 1
      if (!map.has(s)) map.set(s, [])
      map.get(s)!.push(ep)
    }
    for (const [s, list] of map) list.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [episodes])

  // Który sezon otwarty – domyślnie ten z wybraną epką lub pierwszy
  const [openSeason, setOpenSeason] = useState<number | null>(null)
  useEffect(() => {
    if (selectedEpisode?.season) setOpenSeason(selectedEpisode.season)
    else if (seasons.length) setOpenSeason(seasons[0][0])
  }, [selectedEpisode?.season, seasons.length])

  return (
    <aside className={`rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-3 lg:p-4 ${className || ""}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Episodes</h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {(!episodes || episodes.length === 0) && !isLoading ? (
        <p className="text-sm text-muted-foreground">No episodes available.</p>
      ) : null}

      <div className="space-y-3">
        {seasons.map(([seasonNumber, eps]) => {
          const opened = openSeason === seasonNumber
          return (
            <div key={seasonNumber} className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSeason(opened ? null : seasonNumber)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 text-sm font-medium"
              >
                <span>Season {seasonNumber}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {eps.length} eps
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${opened ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {opened && (
                <ul className="p-2 space-y-1.5 bg-card/40">
                  {eps.map((ep) => {
                    const active =
                      selectedEpisode?.season === seasonNumber &&
                      selectedEpisode?.episode === ep.episodeNumber

                    return (
                      <li key={`${seasonNumber}-${ep.episodeNumber}`}>
                        <button
                          type="button"
                          onClick={() => onEpisodeSelect?.(seasonNumber, ep.episodeNumber)}
                          className={`w-full text-left rounded-md px-3 py-2 text-xs sm:text-sm transition ${
                            active
                              ? "bg-primary/15 border border-primary/40 text-primary"
                              : "hover:bg-muted/40 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              E{ep.episodeNumber} · {ep.title || ep.primaryTitle || "Episode"}
                            </span>
                            {ep.runtimeSeconds ? (
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {Math.round((ep.runtimeSeconds || 0) / 60)}m
                              </span>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
