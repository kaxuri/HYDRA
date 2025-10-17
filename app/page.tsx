"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Loader2, SlidersHorizontal } from "lucide-react"
import { useDebounce } from "use-debounce"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { MovieCard } from "../components/movie-card"
import { VideoPlayer } from "../components/video-player"
import { EpisodesList } from "../components/episodes-list"
import AnimatedLogo from "../components/logo"
import { Cast } from "../components/cast"
import Link from "next/link"
import LatestReleases from "../components/LatestReleases"
import Image from "next/image"

interface Movie {
  id: string
  type: string
  primaryTitle: string
  originalTitle: string
  startYear: number
  runtimeSeconds?: number
  genres: string[]
  primaryImage?: { url: string; width: number; height: number }
  rating?: { aggregateRating: number; voteCount: number }
}

interface Episode {
  id: string
  season: string | number
  episodeNumber: number
  title: string
  primaryImage?: { url: string; width: number; height: number }
  runtimeSeconds?: number
  plot?: string
  rating?: { aggregateRating: number; voteCount: number }
}

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const [suggestions, setSuggestions] = useState<Movie[]>([])
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [filteredResults, setFilteredResults] = useState<Movie[]>([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedEpisode, setSelectedEpisode] = useState<{ season: number; episode: number } | null>(null)
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortOption, setSortOption] = useState("newest")
  const [minYear, setMinYear] = useState(1900)
  const [minRating, setMinRating] = useState(0)
  const [tab, setTab] = useState<"episodes" | "cast">("episodes")
  const cache = useRef<Record<string, Movie[]>>({})
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!selectedMovie || selectedMovie.type !== "tvSeries") {
        setEpisodes([])
        setSelectedEpisode(null)
        return
      }
      setIsLoadingEpisodes(true)
      try {
        const response = await fetch(`/api/episodes?imdbId=${selectedMovie.id}`)
        const data = await response.json()
        const transformed = (data.episodes || []).map((ep: any) => {
          const seasonValue = ep.season ?? ep.seasonNumber ?? ep.SeasonNumber ?? 1
          const parsedSeason =
            typeof seasonValue === "string" ? parseInt(seasonValue, 10) : Number(seasonValue) || 1
          return { ...ep, season: parsedSeason }
        })
        setEpisodes(transformed)
        if (transformed.length > 0) {
          setSelectedEpisode((prev) =>
            prev && Number.isFinite(prev.season) && Number.isFinite(prev.episode)
              ? prev
              : { season: transformed[0].season, episode: transformed[0].episodeNumber }
          )
        }
      } catch (error) {
        console.error("[v0] Error fetching episodes:", error)
        setEpisodes([])
      } finally {
        setIsLoadingEpisodes(false)
      }
    }
    fetchEpisodes()
  }, [selectedMovie])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim()) return setSuggestions([])
      if (cache.current[debouncedQuery]) {
        setSuggestions(cache.current[debouncedQuery])
        return
      }
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        const filtered = (data.titles || []).filter((m: Movie) => m.startYear <= currentYear)
        cache.current[debouncedQuery] = filtered
        setSuggestions(filtered)
      } catch (err) {
        console.error("Error fetching suggestions:", err)
      }
    }
    fetchSuggestions()
  }, [debouncedQuery])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return
    setIsLoading(true)
    setSelectedMovie(null)
    setTab("episodes")
    setShowSuggestions(false)
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      const filtered = (data.titles || []).filter((m: Movie) => m.startYear <= currentYear)
      setSearchResults(filtered)
      setVisibleCount(10)
    } catch (err) {
      console.error("Error fetching movies:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let list = [...searchResults]
    list = list.filter(
      (m) => (!m.startYear || m.startYear >= minYear) && (!m.rating?.aggregateRating || m.rating.aggregateRating >= minRating)
    )
    switch (sortOption) {
      case "newest":
        list.sort((a, b) => (b.startYear || 0) - (a.startYear || 0))
        break
      case "oldest":
        list.sort((a, b) => (a.startYear || 0) - (b.startYear || 0))
        break
      case "rating-high":
        list.sort((a, b) => (b.rating?.aggregateRating || 0) - (a.rating?.aggregateRating || 0))
        break
      case "rating-low":
        list.sort((a, b) => (a.rating?.aggregateRating || 0) - (b.rating?.aggregateRating || 0))
        break
    }
    setFilteredResults(list)
  }, [searchResults, sortOption, minYear, minRating])

  const syncUrl = (movie: Movie | null, ep?: { season: number; episode: number } | null, method: "push" | "replace" = "replace") => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
    if (movie?.id) params.set("title", movie.id)
    else params.delete("title")
    if (movie?.type === "tvSeries" && ep?.season && ep?.episode) {
      params.set("s", String(ep.season))
      params.set("e", String(ep.episode))
    } else {
      params.delete("s")
      params.delete("e")
    }
    const qs = params.toString()
    const url = qs ? `/?${qs}` : "/"
    const fn = method === "push" ? router.push : router.replace
    fn(url, { scroll: false })
  }

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie)
    setShowSuggestions(false)
    setSuggestions([])
    setTab("episodes")
    syncUrl(movie, null, "push")
    setTimeout(() => {
      document.getElementById("video-player")?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 50)
  }

  const handleLogoClick = () => {
    setSelectedMovie(null)
    setSelectedEpisode(null)
    setSearchResults([])
    setSuggestions([])
    setSearchQuery("")
    syncUrl(null, null, "push")
  }

  const handleEpisodeSelect = (season: number, episode: number) => {
    const next = { season, episode }
    setSelectedEpisode(next)
    syncUrl(selectedMovie, next, "replace")
    setTimeout(() => {
      document.getElementById("video-player")?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }

  // 🔹 URL sync — wczytanie po ID z /api/title + bezpieczny parsing
  useEffect(() => {
    const id = searchParams.get("title")
    const sRaw = searchParams.get("s")
    const eRaw = searchParams.get("e")
    const s = sRaw ? parseInt(sRaw, 10) : undefined
    const e = eRaw ? parseInt(eRaw, 10) : undefined

    if (!id) {
      if (selectedMovie) {
        setSelectedMovie(null)
        setSelectedEpisode(null)
      }
      return
    }

    if (selectedMovie?.id === id) {
      if (selectedMovie.type === "tvSeries" && Number.isFinite(s) && Number.isFinite(e)) {
        setSelectedEpisode({ season: s as number, episode: e as number })
      }
      return
    }

    ;(async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/title?id=${encodeURIComponent(id)}`, { cache: "no-store" })
        const text = await res.text()

        let data: any = null
        try {
          data = JSON.parse(text)
        } catch {
          console.error("Non-JSON response from /api/title:", text.slice(0, 300))
          return
        }

        const found = (data?.title || null) as Movie | null
        if (found) {
          setSelectedMovie(found)
          if (found.type === "tvSeries" && Number.isFinite(s) && Number.isFinite(e)) {
            setSelectedEpisode({ season: s as number, episode: e as number })
          } else {
            setSelectedEpisode(null)
          }
          setTab("episodes")
          setTimeout(() => {
            document.getElementById("video-player")?.scrollIntoView({ behavior: "smooth", block: "center" })
          }, 50)
        } else {
          console.error("Title not found by id:", id, "payload:", data)
        }
      } catch (err) {
        console.error("Failed to preselect from URL (by id):", err)
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()])

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="text-center my-4 flex flex-col items-center justify-center cursor-pointer" onClick={handleLogoClick}>
          <AnimatedLogo width={384} />
          <p className="text-muted-foreground text-lg my-4">
            Watch Any Movie or Show with No Registration — 100% Free Forever 😍
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-4 relative py-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for movies/shows..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10 h-12 text-base bg-card border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setSuggestions([])
                    setShowSuggestions(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Search"}
            </Button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 bg-[#02020252] backdrop-blur-sm border border-border rounded-lg shadow-lg mt-2 w-full max-h-60 overflow-auto">
              {suggestions.slice(0, 6).map((movie) => (
                <li
                  key={movie.id}
                  onClick={() => handleMovieSelect(movie)}
                  className="px-4 py-2 hover:bg-[#02020291] cursor-pointer flex justify-between items-center"
                >
                  <span>
                    {movie.primaryTitle} <span className="text-xs text-muted-foreground">({movie.startYear})</span>
                  </span>
                  {movie.rating && (
                    <span className="text-xs text-yellow-400">⭐ {movie.rating.aggregateRating.toFixed(1)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="max-w-2xl mx-auto mb-8">
          <Link href="https://ublockorigin.com/" target="_blank" rel="noopener noreferrer">
            <div className="shadow-md shadow-red-900 flex items-center gap-4 rounded-2xl border border-red-800 bg-[#ff00001a] p-4 md:p-5">
              <div className="shrink-0">
                <Image src="/UBlock_Origin.svg" alt="uBlock Origin" width={48} height={48} className="w-12 h-12 rounded-xl ring-1" priority={false} />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">
                  Hydra is better with <span className="text-[#ff0000]">uBlock Origin</span>
                </h3>
                <p className="text-sm text-muted-foreground">Block intrusive ads and trackers for faster, cleaner streaming.</p>
              </div>
            </div>
          </Link>
        </div>

        {!selectedMovie && searchResults.length === 0 && <LatestReleases onSelect={handleMovieSelect} />}

        {selectedMovie && (
          <>
            <div id="video-player" className="mb-6">
              <VideoPlayer
                movie={selectedMovie}
                episodes={episodes as any}
                selectedEpisode={selectedEpisode}
                onEpisodeSelect={handleEpisodeSelect}
                isLoadingEpisodes={isLoadingEpisodes}
              />
            </div>

            <div className="flex gap-2 items-center mb-6">
              <Button variant={tab === "episodes" ? "default" : "ghost"} onClick={() => setTab("episodes")}>
                Episodes
              </Button>
              <Button variant={tab === "cast" ? "default" : "ghost"} onClick={() => setTab("cast")}>
                Cast
              </Button>
            </div>

            {tab === "episodes" && (
              <div className="mb-8">
                <EpisodesList
                  episodes={episodes as any}
                  selectedEpisode={selectedEpisode}
                  onEpisodeSelect={handleEpisodeSelect}
                  isLoading={isLoadingEpisodes}
                />
              </div>
            )}
            {tab === "cast" && (
              <div className="mb-8">
                <Cast imdbId={selectedMovie.id} />
              </div>
            )}
          </>
        )}

        {!selectedMovie && filteredResults.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold">Search Results</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                <Select onValueChange={setSortOption} defaultValue="newest">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="rating-high">Highest Rating</SelectItem>
                    <SelectItem value="rating-low">Lowest Rating</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Min Year" value={minYear} onChange={(e) => setMinYear(Number(e.target.value))} className="w-28" />
                <Input type="number" step="0.1" placeholder="Min Rating" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-28" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredResults.slice(0, visibleCount).map((movie) => (
                <MovieCard key={movie.id} movie={movie} onSelect={handleMovieSelect} isSelected={false} />
              ))}
            </div>

            {visibleCount < filteredResults.length && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => setVisibleCount((p) => p + 10)}>
                  Show More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="py-8 border-t border-border text-center mt-auto">
        <p className="text-muted-foreground text-sm mb-3">Powered by</p>
        <Image
          src="/logo.svg"
          alt="Powered Logo"
          width={160}
          height={40}
          className="mx-auto w-40 h-auto opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
          onClick={handleLogoClick}
          priority={false}
        />
        <p className="text-muted-foreground text-xs mt-3">
          © 2025 Hydra. All rights reserved.
          <br />
          Hydra uses the vidsrc.to API for streaming and imdbapi.dev for fetching info from IMDB database — we do not host or upload any videos.
        </p>
      </footer>
    </main>
  )
}
