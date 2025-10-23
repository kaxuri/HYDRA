"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Loader2, SlidersHorizontal } from "lucide-react"
import Footer from "@/components/footer"
import { useDebounce } from "use-debounce"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { MovieCard } from "../components/movie-card"
import { VideoPlayer } from "../components/video-player"
import AnimatedLogo from "../components/logo"
import Link from "next/link"
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

const CURRENT_YEAR = 2025
const MIN_VOTES = 100

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery] = useDebounce(searchQuery, 500)
  const [suggestions, setSuggestions] = useState<Movie[]>([])
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [filteredResults, setFilteredResults] = useState<Movie[]>([])
  const [visibleCount, setVisibleCount] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Player state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedEpisode, setSelectedEpisode] = useState<{ season: number; episode: number } | null>(null)
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false)
  const [tab, setTab] = useState<"episodes" | "cast">("episodes")

  // Sorting/filter inputs for search results section
  const [sortOption, setSortOption] = useState("newest")
  const [minYear, setMinYear] = useState(1900)
  const [minRating, setMinRating] = useState(0)

  // Homepage sections (3 listy)
  const [latest, setLatest] = useState<Movie[]>([])
  const [rated, setRated] = useState<Movie[]>([])
  const [watched, setWatched] = useState<Movie[]>([])
  const [loadingSections, setLoadingSections] = useState(true)

  const cache = useRef<Record<string, Movie[]>>({})
  const currentYear = new Date().getFullYear()

  // wspólny filtr (poster, votes>=100, year<=2025)
  const allowTitle = (m: Movie) =>
    (!!m.primaryImage?.url) &&
    (!!m.rating?.voteCount && m.rating.voteCount >= MIN_VOTES) &&
    (!m.startYear || m.startYear <= CURRENT_YEAR)

  // ---------- Sekcje na homepage (limit 8) ----------
  useEffect(() => {
    let active = true
    const fetchSection = async (qs: string) => {
      const r = await fetch(`/api/discover/titles?${qs}`, { cache: "no-store" })
      const ct = r.headers.get("content-type") || ""
      const j = ct.includes("application/json") ? await r.json().catch(() => ({})) : {}
      const arr = Array.isArray(j?.titles) ? (j.titles as Movie[]) : []
      return arr.filter(allowTitle).slice(0, 8) // ⬅️ max 8
    }
    ;(async () => {
      try {
        setLoadingSections(true)
        const [latestRaw, ratedRaw, watchedRaw] = await Promise.all([
          fetchSection(
            new URLSearchParams({
              limit: "20", // pobierz trochę więcej i przytnij do 8 po filtrach
              sortBy: "SORT_BY_RELEASE_DATE",
              sortOrder: "DESC",
              minVoteCount: String(MIN_VOTES), // serwer i tak wymusi >= 100
              endYear: String(CURRENT_YEAR),
            }).toString()
          ),
          fetchSection(
            new URLSearchParams({
              limit: "20",
              sortBy: "SORT_BY_USER_RATING",
              sortOrder: "DESC",
              minVoteCount: String(MIN_VOTES),
              endYear: String(CURRENT_YEAR),
            }).toString()
          ),
          fetchSection(
            new URLSearchParams({
              limit: "20",
              sortBy: "SORT_BY_USER_RATING_COUNT",
              sortOrder: "DESC",
              minVoteCount: String(MIN_VOTES),
              endYear: String(CURRENT_YEAR),
            }).toString()
          ),
        ])
        if (!active) return
        setLatest(latestRaw)
        setRated(ratedRaw)
        setWatched(watchedRaw)
      } finally {
        if (active) setLoadingSections(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  // ---------- Episodes fetch when selectedMovie changes ----------
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
        console.error("[home] Error fetching episodes:", error)
        setEpisodes([])
      } finally {
        setIsLoadingEpisodes(false)
      }
    }
    fetchEpisodes()
  }, [selectedMovie])

  // ---------- Suggestions (debounced) ----------
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
        const filtered = (data.titles || [])
          .filter((m: Movie) => m.startYear <= currentYear)
          .filter(allowTitle) // ⬅️ votes>=100 etc.
        cache.current[debouncedQuery] = filtered
        setSuggestions(filtered)
      } catch (err) {
        console.error("Error fetching suggestions:", err)
      }
    }
    fetchSuggestions()
  }, [debouncedQuery])

  // ---------- Full search (only on Search button) ----------
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
      const filtered = (data.titles || [])
        .filter((m: Movie) => m.startYear <= currentYear)
        .filter(allowTitle) // ⬅️ votes>=100 etc.
      setSearchResults(filtered)
      setVisibleCount(10)
    } catch (err) {
      console.error("Error fetching movies:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // ---------- Sorting & filtering (applied to searchResults only) ----------
  useEffect(() => {
    let list = [...searchResults]
    list = list.filter(
      (m) =>
        (!m.startYear || m.startYear >= minYear) &&
        (!m.rating?.aggregateRating || m.rating.aggregateRating >= minRating)
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

  // ---------- URL sync helper ----------
  const syncUrl = (
    movie: Movie | null,
    ep?: { season: number; episode: number } | null,
    method: "push" | "replace" = "replace"
  ) => {
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

  // ---------- URL → state (/?title=...) ----------
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
        const res = await fetch(`/api/search?query=${encodeURIComponent(id)}`)
        const data = await res.json()
        const titles = (data.titles || []) as Movie[]
        const found = titles.find((t) => t.id === id) || titles[0]
        if (found && allowTitle(found)) {
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
        }
      } catch (err) {
        console.error("Failed to preselect from URL:", err)
      } finally {
        setIsLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()])

  // ---------- Sekcja wspólna ----------
  const Section = ({
    title,
    moreHref,
    items,
  }: { title: string; moreHref: string; items: Movie[] }) => (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
        <Link href={moreHref}>
          <Button variant="ghost" className="text-primary">See more →</Button>
        </Link>
      </div>

      {loadingSections && items.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">No titles found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.slice(0, 8).map((movie) => ( // ⬅️ max 8 wizualnie
            <MovieCard key={movie.id} movie={movie} onSelect={handleMovieSelect} isSelected={false} />
          ))}
        </div>
      )}
    </section>
  )

  return (

    <section className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-12 flex-1">
        {/* Header */}
        <div
          className="text-center my-4 flex flex-col items-center justify-center cursor-pointer"
          onClick={handleLogoClick}
        >
          <AnimatedLogo width={384} />
          <p className="text-muted-foreground text-lg my-4">
            Watch Any Movie or Show with No Registration — 100% Free Forever 😍
          </p>
        </div>

        {/* Search bar + suggestions */}
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
            <Button
              type="submit"
              size="lg"
              className="h-12 px-8 bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Search"}
            </Button>
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 bg-[#02020252] backdrop-blur-sm border border-border rounded-lg shadow-lg mt-2 w-full max-h-60 overflow-auto">
              {suggestions.slice(0, 6).map((movie) => (
                <li
                  key={movie.id}
                  onClick={() => handleMovieSelect(movie)}
                  className="px-4 py-2 hover:bg-[#02020291] cursor-pointer flex justify-between items-center"
                >
                  <span>
                    {movie.primaryTitle}{" "}
                    <span className="text-xs text-muted-foreground">({movie.startYear})</span>
                  </span>
                  {movie.rating && (
                    <span className="text-xs text-yellow-400">⭐ {movie.rating.aggregateRating.toFixed(1)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </form>

        {/* uBlock banner */}
        <div className="max-w-2xl mx-auto mb-8">
          <Link href="https://ublockorigin.com/" target="_blank" rel="noopener noreferrer">
            <div className="shadow-md shadow-red-900 flex items-center gap-4 rounded-2xl border border-red-800 bg-[#ff00001a] p-4 md:p-5">
              <div className="shrink-0">
                <Image
                  src="/UBlock_Origin.svg"
                  alt="uBlock Origin"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl ring-1"
                  priority={false}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">
                  Hydra is better with <span className="text-[#ff0000]">uBlock Origin</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Block intrusive ads and trackers for faster, cleaner streaming.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Player + tabs */}
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
          </>
        )}

        {/* Wyniki wyszukiwania */}
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
                <Input
                  type="number"
                  placeholder="Min Year"
                  value={minYear}
                  onChange={(e) => setMinYear(Number(e.target.value))}
                  className="w-28"
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Min Rating"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-28"
                />
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

        {!selectedMovie && filteredResults.length === 0 && (
          <>
            <Section title="Latest Releases" moreHref="/discover?sort=RELEASE_DESC" items={latest} />
            <Section title="Top Rated" moreHref="/discover?sort=RATING_DESC" items={rated} />
            <Section title="Most Watched" moreHref="/discover?sort=COUNT_DESC" items={watched} />
          </>
        )}
      </div>
      <Footer />
    </section>
  )
}
