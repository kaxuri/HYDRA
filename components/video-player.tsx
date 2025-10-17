import { Card } from "../components/ui/card"
import { Star } from "lucide-react"
interface Movie {
  id: string
  type: string
  primaryTitle: string
  originalTitle: string
  startYear: number
  runtimeSeconds?: number
  genres: string[]
  primaryImage?: {
    url: string
    width: number
    height: number
  }
  rating?: {
    aggregateRating: number
    voteCount: number
  }
}
interface Episode {
  id: string
  seasonNumber: number
  episodeNumber: number
  primaryTitle: string
  originalTitle: string
  startYear?: number
  runtimeSeconds?: number
}
interface VideoPlayerProps {
  movie: Movie
  episodes?: Episode[]
  selectedEpisode?: { season: number; episode: number } | null
  onEpisodeSelect?: (season: number, episode: number) => void
  isLoadingEpisodes?: boolean
}
export function VideoPlayer({
  movie,
  selectedEpisode,
}: VideoPlayerProps) {
  const getEmbedUrl = () => {
    if (movie.type === "tvSeries" && selectedEpisode) {
      return `https://vidsrc.to/embed/tv/${movie.id}/${selectedEpisode.season}/${selectedEpisode.episode}`
    } else if (movie.type === "movie") {
      return `https://vidsrc.to/embed/movie/${movie.id}`
    } else {
      return `https://vidsrc.to/embed/tv/${movie.id}`
    }
  }
  const mainGenre = movie.genres?.[0]
  return (
    <div className="w-full mx-auto">
      <Card className="overflow-hidden w-full bg-card border-border">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-2xl font-bold">{movie.primaryTitle}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {movie.startYear && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-black/70 backdrop-blur-sm text-white">
                  {movie.startYear}
                </span>
              )}
              {mainGenre && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-black/70 backdrop-blur-sm text-white">
                  {mainGenre}
                </span>
              )}
              {movie.rating?.aggregateRating != null && (
                <span className="px-2 py-1 text-xs font-medium rounded-md bg-black/70 backdrop-blur-sm text-yellow-400 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {movie.rating.aggregateRating.toFixed(1)}
                </span>
              )}
              {movie.type === "tvSeries" &&
                selectedEpisode &&
                Number.isFinite(selectedEpisode.season) &&
                Number.isFinite(selectedEpisode.episode) && (
                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-primary/20 text-primary border border-primary/40">
                    S{selectedEpisode.season}E{selectedEpisode.episode}
                  </span>
                )}
            </div>
          </div>
        </div>
        <div className="relative aspect-video bg-black">
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      </Card>
    </div>
  )
}