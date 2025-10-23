"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Star, Server, Film, Tv } from "lucide-react"
import EpisodesSidebar, { Episode } from "./episodes-sidebar"
import { Cast } from "../components/cast"

interface Movie {
  id: string
  type: string // "movie" | "tvSeries" | ...
  primaryTitle: string
  originalTitle: string
  startYear: number
  runtimeSeconds?: number
  genres: string[]
  primaryImage?: { url: string; width: number; height: number }
  rating?: { aggregateRating: number; voteCount: number }
  plot?: string
}

interface VideoPlayerProps {
  movie: Movie
  episodes?: Episode[]
  selectedEpisode?: { season: number; episode: number } | null
  onEpisodeSelect?: (season: number, episode: number) => void
  isLoadingEpisodes?: boolean
}

type Provider = "vidsrc" | "vidfast"
type Tab = "about" | "cast"

export function VideoPlayer({
  movie,
  episodes = [],
  selectedEpisode,
  onEpisodeSelect,
  isLoadingEpisodes,
}: VideoPlayerProps) {
  const isSeries = movie.type === "tvSeries"

  // Provider toggle (persist in localStorage)
  const [provider, setProvider] = useState<Provider>("vidsrc")
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("hydra_provider") : null
    if (saved === "vidsrc" || saved === "vidfast") setProvider(saved)
  }, [])
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("hydra_provider", provider)
  }, [provider])

  // Tabs: About / Cast
  const [tab, setTab] = useState<Tab>("about")

  // Ensure some episode selected for series
  useEffect(() => {
    if (!isSeries || !episodes?.length) return
    if (!selectedEpisode || !Number.isFinite(selectedEpisode.season) || !Number.isFinite(selectedEpisode.episode)) {
      const first = normalizeEpisodes(episodes)[0]
      if (first && onEpisodeSelect) onEpisodeSelect(first.season, first.episodeNumber)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeries, episodes?.length])

  const normalized = useMemo(() => normalizeEpisodes(episodes), [episodes])

  const src = useMemo(() => {
    const key = `${provider}-${movie.id}-${isSeries ? `${selectedEpisode?.season}-${selectedEpisode?.episode}` : ""}`
    return { url: buildEmbedUrl(provider, movie, selectedEpisode), key }
  }, [provider, movie, selectedEpisode, isSeries])

  // ---- MOVIE: bez sidebara, klasyczna szerokość ----
  if (!isSeries) {
    return (
      <div className="max-w-5xl mx-auto w-full">
        <Card className="overflow-hidden bg-card border-border">
          <Header movie={movie} selectedEpisode={null} />
          <PlayerFrame srcKey={src.key} url={src.url} />
          <ProviderSwitch provider={provider} setProvider={setProvider} />
        </Card>

        {/* Tabs under the player */}
        <div className="mt-6">
          <div className="flex gap-2 items-center mb-4">
            <Button variant={tab === "about" ? "default" : "ghost"} onClick={() => setTab("about")}>
              About
            </Button>
            <Button variant={tab === "cast" ? "default" : "ghost"} onClick={() => setTab("cast")}>
              Cast
            </Button>
          </div>

          {tab === "about" ? (
            <AboutPanel movie={movie} episodes={[]} selectedEpisode={null} />
          ) : (
            <Cast imdbId={movie.id} />
          )}
        </div>
      </div>
    )
  }

  // ---- SERIES: player + right sidebar ----
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <Card className="overflow-hidden bg-card border-border">
            <Header movie={movie} selectedEpisode={selectedEpisode} />
            <PlayerFrame srcKey={src.key} url={src.url} />
            <ProviderSwitch provider={provider} setProvider={setProvider} />
          </Card>

          {/* Tabs under the player */}
          <div className="mt-6">
            <div className="flex gap-2 items-center mb-4">
              <Button variant={tab === "about" ? "default" : "ghost"} onClick={() => setTab("about")}>
                About
              </Button>
              <Button variant={tab === "cast" ? "default" : "ghost"} onClick={() => setTab("cast")}>
                Cast
              </Button>
            </div>

            {tab === "about" ? (
              <AboutPanel movie={movie} episodes={normalized} selectedEpisode={selectedEpisode || null} />
            ) : (
              <Cast imdbId={movie.id} />
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-4 h-fit">
          <EpisodesSidebar
            episodes={normalized}
            selectedEpisode={selectedEpisode || null}
            onEpisodeSelect={onEpisodeSelect}
            isLoading={isLoadingEpisodes}
          />
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── helpers & subcomponents ───────────────────────── */

function Header({
  movie,
  selectedEpisode,
}: {
  movie: Movie
  selectedEpisode: { season: number; episode: number } | null
}) {
  return (
    <div className="p-4 sm:p-6 border-b border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {movie.type === "tvSeries" ? <Tv className="h-4 w-4" /> : <Film className="h-4 w-4" />}
        <span className="text-xs uppercase tracking-wide">{prettyType(movie.type)}</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold mb-3">{movie.primaryTitle}</h2>

      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        {/* rok */}
        <BadgeLite>{movie.startYear}</BadgeLite>

        {/* gatunki */}
        {movie.genres?.slice(0, 2).map((g) => (
          <BadgeLite key={g}>{g}</BadgeLite>
        ))}

        {/* ocena */}
        {movie.rating?.aggregateRating ? (
          <BadgeLite className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            {movie.rating.aggregateRating.toFixed(1)}
            {typeof movie.rating.voteCount === "number" ? (
              <span className="text-muted-foreground">({movie.rating.voteCount.toLocaleString()})</span>
            ) : null}
          </BadgeLite>
        ) : null}

        {/* epka */}
        {movie.type === "tvSeries" && selectedEpisode ? (
          <BadgeLite className="text-primary border-primary/40 bg-primary/10">
            S{selectedEpisode.season}E{selectedEpisode.episode}
          </BadgeLite>
        ) : null}
      </div>
    </div>
  )
}

function PlayerFrame({ srcKey, url }: { srcKey: string; url: string }) {
  return (
    <div className="relative aspect-video bg-black">
      <iframe
        key={srcKey}
        src={url}
        className="w-full h-full"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  )
}

/** Provider Switch – dopieszczony wizualnie */
function ProviderSwitch({
  provider,
  setProvider,
}: {
  provider: Provider
  setProvider: (p: Provider) => void
}) {
  return (
    <div className="p-3 sm:p-4 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Streaming provider</span>
        </div>

        <div className="flex items-center gap-2">
          <Segment
            active={provider === "vidsrc"}
            title="vidsrc"
            subtitle="Fast & simple"
            onClick={() => setProvider("vidsrc")}
            icon={<Film className="h-4 w-4" />}
          />
          <Segment
            active={provider === "vidfast"}
            title="vidfast"
            subtitle="Alt servers"
            onClick={() => setProvider("vidfast")}
            icon={<Tv className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  )
}

function Segment({
  active,
  title,
  subtitle,
  onClick,
  icon,
}: {
  active: boolean
  title: string
  subtitle?: string
  onClick: () => void
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "group inline-flex items-center gap-3 rounded-xl border px-3 py-2 sm:px-4 sm:py-2.5",
        "transition shadow-sm hover:shadow",
        active
          ? "border-primary/40 bg-primary/10 ring-1 ring-primary/40 text-primary"
          : "border-border bg-card/60 hover:bg-card",
      ].join(" ")}
    >
      <div
        className={[
          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
          active ? "bg-primary/15" : "bg-muted/60",
        ].join(" ")}
      >
        {icon}
      </div>
      <div className="text-left leading-tight">
        <div className="text-sm font-medium">{title}</div>
        {subtitle ? <div className="text-[11px] text-muted-foreground">{subtitle}</div> : null}
      </div>
    </button>
  )
}

function BadgeLite({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border bg-card/60 px-2 py-0.5",
        className || "",
      ].join(" ")}
    >
      {children}
    </span>
  )
}

function prettyType(t: string) {
  const u = (t || "").toUpperCase()
  if (u === "TVSERIES" || u === "TV_SERIES") return "TV Show"
  if (u === "TVMINISERIES" || u === "TV_MINI_SERIES") return "TV Mini-Series"
  if (u === "TVSPECIAL" || u === "TV_SPECIAL") return "TV Special"
  if (u === "TVMOVIE" || u === "TV_MOVIE") return "TV Movie"
  if (u === "VIDEO_GAME") return "Video Game"
  if (u === "MOVIE") return "Movie"
  return t
}

function normalizeEpisodes(list: Episode[]): Episode[] {
  return (list || []).map((ep) => {
    const seasonValue = (ep as any).season ?? (ep as any).seasonNumber ?? (ep as any).SeasonNumber ?? 1
    const season =
      typeof seasonValue === "string" ? parseInt(seasonValue, 10) || 1 : Number(seasonValue) || 1
    return { ...ep, season }
  })
}

function buildEmbedUrl(
  provider: "vidsrc" | "vidfast",
  movie: Movie,
  sel?: { season: number; episode: number } | null
) {
  const isSeries = movie.type === "tvSeries"

  if (provider === "vidfast") {
    if (isSeries && sel?.season && sel?.episode) {
      return `https://vidfast.pro/tv/${movie.id}/${sel.season}/${sel.episode}?autoPlay=true&title=false&poster=false&nextButton=true&autoNext=true`
    }
    return `https://vidfast.pro/movie/${movie.id}?autoPlay=true&title=false&poster=false`
  }

  // VIDSRC (domyślnie)
  if (isSeries && sel?.season && sel?.episode) {
    return `https://vidsrc.to/embed/tv/${movie.id}/${sel.season}/${sel.episode}`
  }
  return `https://vidsrc.to/embed/movie/${movie.id}`
}

/* ---------------------------- About Panel ---------------------------- */

function AboutPanel({
  movie,
  episodes,
  selectedEpisode,
}: {
  movie: Movie
  episodes: Episode[]
  selectedEpisode: { season: number; episode: number } | null
}) {
  const epPlot =
    selectedEpisode
      ? episodes.find(
          (e) => e.season === selectedEpisode.season && e.episodeNumber === selectedEpisode.episode
        )?.plot
      : null

  const plot = epPlot || movie.plot || "No plot available."

  const mins =
    typeof movie.runtimeSeconds === "number" && movie.runtimeSeconds > 0
      ? Math.round(movie.runtimeSeconds / 60)
      : undefined

  return (
    <Card className="p-4 sm:p-6 bg-card border-border">
      <h3 className="text-xl font-semibold mb-2">About</h3>
      <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">{plot}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <LabelRow label="Name" value={movie.primaryTitle} />
          <LabelRow label="Category" value={movie.type === "tvSeries" ? "TV Show" : "Movie"} />
          <LabelRow label="Year" value={String(movie.startYear)} />
        </div>
        <div className="space-y-1">
          <LabelRow label="Genres" value={(movie.genres || []).join(", ") || "—"} />
          <LabelRow label="Runtime" value={mins ? `${mins} min` : "—"} />
          <LabelRow
            label="Rating"
            value={
              movie.rating?.aggregateRating
                ? `${movie.rating.aggregateRating.toFixed(1)} (${movie.rating.voteCount?.toLocaleString?.() || 0})`
                : "—"
            }
          />
        </div>
      </div>
    </Card>
  )
}

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
