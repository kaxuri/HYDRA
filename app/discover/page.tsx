"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MovieCard } from "../../components/movie-card"
import { Input } from "../../components/ui/input"
import Image from "next/image"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select"
import { Button } from "../../components/ui/button"
import { Loader2, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"

type TitleType =
  | "MOVIE"
  | "TV_SERIES"
  | "TV_MINI_SERIES"
  | "TV_SPECIAL"
  | "TV_MOVIE"
  | "SHORT"
  | "VIDEO"
  | "VIDEO_GAME"

type SortBy =
  | "SORT_BY_POPULARITY"
  | "SORT_BY_RELEASE_DATE"
  | "SORT_BY_USER_RATING"
  | "SORT_BY_USER_RATING_COUNT"
  | "SORT_BY_YEAR"

type SortOrder = "ASC" | "DESC"

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
  plot?: string
}

interface TitlesResponse {
  titles: Movie[]
  nextPageToken?: string | null
}

const MAX_YEAR = 2025

export default function DiscoverPage() {
  const router = useRouter()

  // dane
  const [genresFromApi, setGenresFromApi] = useState<string[]>([])
  const [pages, setPages] = useState<Movie[][]>([]) // cache stron (już przefiltrowane lokalnie)
  const [pageTokens, setPageTokens] = useState<(string | null)[]>([]) // token do nast. strony
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(false)

  // filtry
  const [titleType, setTitleType] = useState<TitleType | "ALL">("ALL")
  const [genreFilter, setGenreFilter] = useState<string>("all")
  const [yearMin, setYearMin] = useState<number | "">("")
  const [yearMax, setYearMax] = useState<number | "">(MAX_YEAR) // domyślnie 2025
  const [minRating, setMinRating] = useState<number | "">("")
  const [minVotes, setMinVotes] = useState<number | "">("")
  const [sortBy, setSortBy] = useState<SortBy>("SORT_BY_RELEASE_DATE")
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC")

  const activePageTitles = pages[currentPage] ?? []

  const allLoadedTitles = useMemo(() => pages.flat(), [pages])
  const fallbackGenres = useMemo(() => {
    const s = new Set<string>()
    for (const m of allLoadedTitles) m.genres?.forEach((g) => g && s.add(g))
    return Array.from(s).sort((a, b) => a.localeCompare(b))
  }, [allLoadedTitles])

  const genreOptions = (genresFromApi.length ? genresFromApi : fallbackGenres)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch("/api/discover/interests", { cache: "no-store" })
        const json = await res.json()
        const list: string[] = Array.isArray(json?.interests) ? json.interests : []
        if (!mounted) return
        setGenresFromApi(list.sort((a, b) => a.localeCompare(b)))
      } catch (e) {
        console.error("Failed to fetch interests:", e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const buildQuery = (nextPageToken?: string | null) => {
    const q = new URLSearchParams()
    q.set("limit", "25")

    if (titleType !== "ALL") q.append("types", titleType)
    if (genreFilter !== "all") q.append("genres", genreFilter)

    if (yearMin !== "") q.set("startYear", String(yearMin))
    const cappedEndYear = Math.min(
      typeof yearMax === "number" ? yearMax : MAX_YEAR,
      MAX_YEAR
    )
    q.set("endYear", String(cappedEndYear))

    if (minRating !== "") q.set("minAggregateRating", String(minRating))
    if (minVotes !== "") q.set("minVoteCount", String(minVotes))

    q.set("sortBy", sortBy)
    q.set("sortOrder", sortOrder)

    if (nextPageToken) q.set("pageToken", nextPageToken)
    return q.toString()
  }


  const localGuard = (arr: Movie[]) =>
    arr.filter(
      (m) =>
        (m.startYear ?? 0) <= MAX_YEAR &&
        !!m.primaryImage?.url
    )

  const loadFirstPage = async () => {
    setLoading(true)
    try {
      const qs = buildQuery()
      const res = await fetch(`/api/discover/titles?${qs}`, { cache: "no-store" })
      const json: TitlesResponse = await res.json()

      const clean = localGuard(json.titles || [])
      setPages([clean])
      setPageTokens([json.nextPageToken ?? null])
      setCurrentPage(0)
    } catch (e) {
      console.error("Discover first page error:", e)
      setPages([[]])
      setPageTokens([null])
      setCurrentPage(0)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadFirstPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleType, genreFilter, yearMin, yearMax, minRating, minVotes, sortBy, sortOrder])

  const loadNextPage = async () => {
    const nextToken = pageTokens[pages.length - 1]
    if (!nextToken) return
    setLoading(true)
    try {
      const qs = buildQuery(nextToken)
      const res = await fetch(`/api/discover/titles?${qs}`, { cache: "no-store" })
      const json: TitlesResponse = await res.json()
      const clean = localGuard(json.titles || [])
      setPages((p) => [...p, clean])
      setPageTokens((t) => [...t, json.nextPageToken ?? null])
      setCurrentPage(pages.length)
    } catch (e) {
      console.error("Discover next page error:", e)
    } finally {
      setLoading(false)
    }
  }

  const pageButtons = useMemo(
    () =>
      pages.map((_, idx) => (
        <Button
          key={idx}
          variant={idx === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(idx)}
          className="min-w-9"
        >
          {idx + 1}
        </Button>
      )),
    [pages, currentPage]
  )

  const handleSelect = (m: Movie) => {
    router.push(`/?title=${encodeURIComponent(m.id)}`)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:flex md:flex-row md:items-start md:gap-8">
        <section className="flex-1">
          <div className="mb-6 flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="h-5 w-5" />
            <h1 className="text-2xl font-semibold">Discover</h1>
            <span className="text-sm">Browse Movies/Shows</span>
          </div>

          {loading && pages.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : activePageTitles.length === 0 ? (
            <p className="text-muted-foreground">No titles found for current filters.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {activePageTitles.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} onSelect={handleSelect} isSelected={false} />
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                {pageButtons}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
                  disabled={currentPage >= pages.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  className="ml-auto"
                  onClick={loadNextPage}
                  disabled={loading || !pageTokens[pages.length - 1]}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
                    </>
                  ) : pageTokens[pages.length - 1] ? (
                    "Load more pages"
                  ) : (
                    "No more pages"
                  )}
                </Button>
              </div>
            </>
          )}
        </section>

        <aside className="mt-10 md:mt-0 md:w-[280px] lg:w-[320px] md:shrink-0">
          <div className="md:sticky md:top-24 space-y-6 rounded-2xl border border-border bg-card/40 backdrop-blur p-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <div>
              <h4 className="text-sm font-medium mb-2">Type</h4>
              <Select value={titleType} onValueChange={(v) => setTitleType(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ALL" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="MOVIE">Movie</SelectItem>
                  <SelectItem value="TV_SERIES">TV Series</SelectItem>
                  <SelectItem value="TV_MINI_SERIES">TV Mini-Series</SelectItem>
                  <SelectItem value="TV_SPECIAL">TV Special</SelectItem>
                  <SelectItem value="TV_MOVIE">TV Movie</SelectItem>
                  <SelectItem value="SHORT">Short</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="VIDEO_GAME">Video Game</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Genre</h4>
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {genreOptions.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Year</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={yearMin}
                  onChange={(e) => setYearMin(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder={`Max (≤ ${MAX_YEAR})`}
                  value={yearMax}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Math.min(Number(e.target.value), MAX_YEAR)
                    setYearMax(val)
                  }}
                  className="w-24"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                We only show titles released up to {MAX_YEAR}.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Min rating</h4>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 6.5"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Min votes</h4>
              <Input
                type="number"
                placeholder="e.g. 1000"
                value={minVotes}
                onChange={(e) => setMinVotes(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Sort by</h4>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SORT_BY_POPULARITY">Popularity</SelectItem>
                  <SelectItem value="SORT_BY_RELEASE_DATE">Release date</SelectItem>
                  <SelectItem value="SORT_BY_USER_RATING">User rating</SelectItem>
                  <SelectItem value="SORT_BY_USER_RATING_COUNT">Ratings count</SelectItem>
                  <SelectItem value="SORT_BY_YEAR">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Sort order</h4>
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="DESC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESC">DESC</SelectItem>
                  <SelectItem value="ASC">ASC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setTitleType("ALL")
                  setGenreFilter("all")
                  setYearMin("")
                  setYearMax(MAX_YEAR)
                  setMinRating("")
                  setMinVotes("")
                  setSortBy("SORT_BY_RELEASE_DATE")
                  setSortOrder("DESC")
                }}
              >
                Reset filters
              </Button>
            </div>
          </div>
        </aside>
      </div>
            <footer className="py-8 border-t border-border text-center mt-auto">
              <p className="text-muted-foreground text-sm mb-3">Powered by</p>
              <Image
                src="/logo.svg"
                alt="Powered Logo"
                width={160}
                height={40}
                className="mx-auto w-40 h-auto opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
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
