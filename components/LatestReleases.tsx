"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { MovieCard } from "../components/movie-card"

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

interface LatestReleasesProps {
  onSelect: (movie: Movie) => void
}

export default function LatestReleases({ onSelect }: LatestReleasesProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchMovies = async () => {
      try {
        const res = await fetch("/api/latest", { cache: "no-store" })
        const data = await res.json()
        if (mounted) {
          setMovies(data.titles || [])
        }
      } catch (e) {
        console.error("Failed to load latest releases:", e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchMovies()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Latest Releases</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 auto-rows-fr">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-full">
              <div className="aspect-[2/3] rounded-xl bg-muted animate-pulse w-full h-full" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <p className="text-muted-foreground text-sm">No recent releases found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 auto-rows-fr">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={onSelect}
              isSelected={false}
            />
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center gap-2 mt-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading latest releases...</span>
        </div>
      )}
    </section>
  )
}
