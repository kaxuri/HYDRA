"use client"

import { Card } from "../components/ui/card"
import Image from "next/image"
import { Play, Star } from "lucide-react"

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

interface MovieCardProps {
  movie: Movie
  onSelect: (movie: Movie) => void
  isSelected: boolean
}

export function MovieCard({ movie, onSelect, isSelected }: MovieCardProps) {
  const poster = movie.primaryImage?.url
  const rating = movie.rating?.aggregateRating
  const year = movie.startYear
  const genre = movie.genres?.[0]

  return (
    <Card
      className={`group h-full cursor-pointer overflow-hidden transition-all hover:scale-105 bg-transparent border-0 shadow-none ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={() => onSelect(movie)}
    >
      <div className="relative aspect-[3/5] rounded-2xl overflow-hidden shadow-lg">
        {/* Poster */}
        {poster ? (
          <Image
            src={poster}
            width={800}
            height={800}
            alt={movie.primaryTitle}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            <div className="text-center p-4">
              <Play className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">No poster</p>
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="h-12 w-12 text-primary drop-shadow" />
        </div>

        {/* Genre badge (lewy górny róg) */}
        {genre && (
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-xs font-medium">{genre}</span>
          </div>
        )}

        {/* Rating + Year (prawy górny róg) */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          {typeof rating === "number" && (
            <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
            </div>
          )}
          {year && (
            <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <span className="text-xs font-semibold">{year}</span>
            </div>
          )}
        </div>

        {/* Tytuł na blurze z dopasowanym zaokrągleniem */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent rounded-b-2xl">
            <div className="backdrop-blur-xs px-3 pb-3 pt-6">
              <h3 className="text-base font-semibold line-clamp-2 drop-shadow-lg text-white">
                {movie.primaryTitle}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
