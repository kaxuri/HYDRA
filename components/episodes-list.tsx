"use client"

import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Play } from "lucide-react"
import { useMemo } from "react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/ui/accordion"

interface Episode {
  id: string
  season?: number
  seasonNumber?: number
  episodeNumber: number
  title: string
  primaryImage?: {
    url: string
    width: number
    height: number
  }
  runtimeSeconds?: number
  plot?: string
}

interface EpisodesListProps {
  episodes: Episode[]
  selectedEpisode?: { season: number; episode: number } | null
  onEpisodeSelect?: (season: number, episode: number) => void
  isLoading?: boolean
}

export function EpisodesList({
  episodes,
  selectedEpisode,
  onEpisodeSelect,
  isLoading,
}: EpisodesListProps) {

  const episodesBySeason = useMemo(() => {
    if (!episodes || !Array.isArray(episodes) || episodes.length === 0) return {}

    const grouped = episodes.reduce(
      (acc, episode) => {

        const rawSeason = (episode as any).season ?? (episode as any).seasonNumber ?? 1
        const season = Number(rawSeason)
        if (!acc[season]) acc[season] = []
        acc[season].push(episode)
        return acc
      },
      {} as Record<number, Episode[]>,
    )

  
    Object.keys(grouped).forEach((season) => {
      grouped[Number(season)].sort((a, b) => a.episodeNumber - b.episodeNumber)
    })

    return grouped
  }, [episodes])

  const seasons = Object.keys(episodesBySeason)
    .map(Number)
    .sort((a, b) => a - b)


  if (isLoading) {
    return (
      <Card className="p-6 bg-card border-border">
        <h3 className="text-xl font-semibold mb-4">Episodes</h3>
        <p className="text-muted-foreground">Loading episodes...</p>
      </Card>
    )
  }

  if (!episodes || episodes.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <h3 className="text-xl font-semibold mb-4">Episodes</h3>
        <p className="text-muted-foreground">No episodes available</p>
      </Card>
    )
  }


  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-xl font-semibold mb-6">Episodes</h3>

      <Accordion type="multiple" className="w-full space-y-4">
        {seasons.map((seasonNumber) => (
          <AccordionItem key={seasonNumber} value={`season-${seasonNumber}`}>
            <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
              Season {seasonNumber}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 mt-4">
                {episodesBySeason[seasonNumber].map((episode) => {
                  const isSelected =
                    selectedEpisode?.season === seasonNumber &&
                    selectedEpisode?.episode === episode.episodeNumber

                  return (
                    <Button
                      key={episode.id}
                      variant={isSelected ? "default" : "outline"}
                      className="w-full justify-start h-auto p-4 text-left"
                      onClick={() => onEpisodeSelect?.(seasonNumber, episode.episodeNumber)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 mt-0.5">
                          <Play className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold mb-1">
                            Episode {episode.episodeNumber}: {episode.title}
                          </div>

                          {episode.runtimeSeconds && (
                            <div className="text-xs text-muted-foreground">
                              {Math.floor(episode.runtimeSeconds / 60)} min
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}
