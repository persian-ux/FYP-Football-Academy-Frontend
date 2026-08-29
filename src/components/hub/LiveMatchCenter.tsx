import { useState, useEffect } from 'react'
import {
  Calendar,
  ExternalLink,
  Flame,
  Globe2,
  Newspaper,
  RefreshCw,
  Search,
  Trophy,
  Tv,
  Users2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GlowCard } from '@/components/common/GlowCard'
import {
  fetchFootballMatches,
  fetchFootballNews,
  LEAGUES,
  LEAGUE_LABELS,
  type FootballMatch,
  type FootballNewsItem,
} from '@/services/footballApi'
import { cn } from '@/lib/utils'

export function LiveMatchCenter() {
  const [matches, setMatches] = useState<FootballMatch[]>([])
  const [news, setNews] = useState<FootballNewsItem[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [newsCategory, setNewsCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const loadData = async (leagueId = selectedLeague, showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const [matchesData, newsData] = await Promise.all([
        fetchFootballMatches(leagueId),
        fetchFootballNews(),
      ])
      setMatches(matchesData)
      setNews(newsData)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Error loading live football data:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData(selectedLeague)
    // Auto-refresh every 90 seconds for live updates
    const interval = setInterval(() => {
      loadData(selectedLeague, true)
    }, 90000)
    return () => clearInterval(interval)
  }, [selectedLeague])

  // Filter news
  const filteredNews = news.filter((item) => {
    const matchesCategory =
      newsCategory === 'All' ||
      item.category.toLowerCase().includes(newsCategory.toLowerCase()) ||
      (newsCategory === 'World Cup' &&
        (item.category.includes('World Cup') || item.title.toLowerCase().includes('world cup')))

    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Filter matches
  const filteredMatches =
    selectedLeague === 'all'
      ? matches
      : selectedLeague === 'academy'
      ? matches.filter((m) => m.league.includes('Sportsphere') || m.id.startsWith('acad'))
      : matches

  const featuredArticle = filteredNews.length > 0 ? filteredNews[0] : null
  const secondaryArticles = filteredNews.slice(1, 7)

  return (
    <section id="updates" className="relative z-20 scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-7xl">
        {/* Section Heading & Live Meta */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Live Match & News Center
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              World Cup & Live Matchday Hub
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Real-time scores, FIFA World Cup qualifying updates, elite youth showcase results, and live tactical intelligence powered by live global football feeds.
            </p>
          </div>

          {/* Controls: Refresh & Last Updated */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-slate-400 font-mono">
              Synced: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(selectedLeague, true)}
              disabled={isRefreshing}
              className="border-white/15 bg-slate-900/60 text-slate-200 hover:text-white hover:border-cyan-500/40 text-xs font-semibold gap-2"
            >
              <RefreshCw className={cn('size-3.5', isRefreshing && 'animate-spin text-cyan-400')} />
              {isRefreshing ? 'Syncing...' : 'Sync Live'}
            </Button>
          </div>
        </div>

        {/* Competition Filter Pills */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5">
            <Trophy className="size-3.5 text-cyan-400" /> Competitions:
          </span>
          {Object.entries(LEAGUES).map(([key, id]) => {
            const isSelected = selectedLeague === id
            return (
              <button
                key={key}
                onClick={() => setSelectedLeague(id)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_18px_rgba(6,182,212,0.4)] font-bold'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
                )}
              >
                {LEAGUE_LABELS[id]}
              </button>
            )
          })}
        </div>

        {/* Main Grid: 2 Columns */}
        <div className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
          {/* Left Column: Live News & World Cup Articles */}
          <div className="space-y-6">
            <GlowCard className="p-6 lg:p-8 border-white/10 bg-slate-900/70 backdrop-blur-xl">
              {/* News Header & Search */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Newspaper className="size-4.5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Live Football News</span>
                  </div>
                  <h3 className="mt-1 text-2xl font-black text-white">Breaking Match & Academy Dispatch</h3>
                </div>

                {/* News Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                  <Input
                    placeholder="Search World Cup, transfers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8.5 pl-9 text-xs border-white/15 bg-slate-950/60 text-white placeholder:text-slate-500 focus-visible:border-cyan-500"
                  />
                </div>
              </div>

              {/* News Categories */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5 pb-2">
                {['All', 'World Cup', 'Youth & Academy', 'Transfers', 'Tactics'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewsCategory(cat)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer',
                      newsCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 bg-white/5 border border-transparent'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Featured Main News Banner */}
              {featuredArticle && (
                <div className="mt-5 group relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/80 transition-all hover:border-cyan-500/50">
                  <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden">
                    <img
                      src={featuredArticle.thumbnail}
                      alt={featuredArticle.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge className="bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                        <Flame className="size-3 mr-1 fill-white" />
                        {featuredArticle.isBreaking ? 'Breaking News' : 'Top Story'}
                      </Badge>
                      <Badge variant="outline" className="border-white/20 bg-black/40 text-slate-200 text-[10px] backdrop-blur-md">
                        {featuredArticle.source}
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-semibold mb-1">
                        <span>{featuredArticle.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="size-3" /> {featuredArticle.relativeTime}
                        </span>
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                        {featuredArticle.title}
                      </h4>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 bg-slate-950/40">
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      {featuredArticle.description}
                    </p>
                    <a
                      href={featuredArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-lg bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 transition-all"
                    >
                      Read Story
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Secondary News Grid */}
              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                {secondaryArticles.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between rounded-xl border border-white/10 bg-slate-950/50 p-4 transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-950/80 hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20">
                          {item.category}
                        </span>
                        <span className="text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="size-3 text-slate-500" />
                          {item.relativeTime}
                        </span>
                      </div>
                      <h5 className="mt-2.5 text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h5>
                      <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{item.source}</span>
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:underline">
                        Details <ExternalLink className="size-3" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </GlowCard>
          </div>

          {/* Right Column: Live Fixtures & Matchdays */}
          <div className="space-y-6">
            <GlowCard className="p-6 lg:p-8 border-white/10 bg-slate-900/70 backdrop-blur-xl h-full flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Tv className="size-3.5 text-emerald-400" /> Live & Upcoming
                    </div>
                    <h3 className="mt-1 text-2xl font-black text-white">Fixtures Matrix</h3>
                  </div>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                    Live Sync Active
                  </Badge>
                </div>

                {/* Academy Spotlight Banner */}
                <div className="mt-5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/50 p-4">
                  <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                    <Sparkles className="size-4 text-cyan-400" />
                    <span>Sportsphere Showcase Matchday</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    Catch live scout broadcasting for Academy U-16 & U-18 squads streaming directly to university & club recruiters.
                  </p>
                </div>

                {/* Matches List */}
                <div className="mt-5 space-y-3">
                  {isLoading ? (
                    <div className="py-12 text-center text-slate-400 space-y-3">
                      <RefreshCw className="size-6 animate-spin mx-auto text-cyan-400" />
                      <p className="text-xs">Fetching live football feeds...</p>
                    </div>
                  ) : filteredMatches.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-6 text-center text-slate-400 text-xs">
                      No fixtures scheduled for this selection right now.
                    </div>
                  ) : (
                    filteredMatches.slice(0, 6).map((match) => (
                      <div
                        key={match.id}
                        className="group rounded-xl border border-white/10 bg-slate-950/50 p-3.5 transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-950/80"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2 mb-2.5">
                          <span className="font-semibold text-slate-300 truncate max-w-[180px]">
                            {match.league}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                              match.status === 'LIVE'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                : match.status === 'FINISHED'
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                            )}
                          >
                            {match.statusText || match.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          {/* Home Team */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {match.homeTeamBadge ? (
                              <img
                                src={match.homeTeamBadge}
                                alt={match.homeTeam}
                                className="size-7 object-contain shrink-0 rounded-full bg-white/5 p-0.5"
                                onError={(e) => {
                                  ;(e.target as HTMLElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="size-7 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                                {match.homeTeam.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs font-bold text-white truncate">{match.homeTeam}</span>
                          </div>

                          {/* Score or VS */}
                          <div className="px-3 text-center">
                            {match.homeScore !== null && match.awayScore !== null ? (
                              <div className="text-sm font-black font-mono text-cyan-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                                {match.homeScore} : {match.awayScore}
                              </div>
                            ) : (
                              <div className="text-[11px] font-bold font-mono text-slate-400">
                                {match.time}
                              </div>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-end gap-2.5 min-w-0">
                            <span className="text-xs font-bold text-white truncate text-right">
                              {match.awayTeam}
                            </span>
                            {match.awayTeamBadge ? (
                              <img
                                src={match.awayTeamBadge}
                                alt={match.awayTeam}
                                className="size-7 object-contain shrink-0 rounded-full bg-white/5 p-0.5"
                                onError={(e) => {
                                  ;(e.target as HTMLElement).style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="size-7 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-400 shrink-0">
                                {match.awayTeam.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span className="truncate max-w-[200px] text-slate-400">📍 {match.venue}</span>
                          <span className="font-mono text-cyan-400/80">{match.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer info about free API integration */}
              <div className="mt-6 border-t border-white/10 pt-4 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Globe2 className="size-3.5 text-cyan-400" />
                  Live API Feeds: TheSportsDB & RSS Feeds
                </span>
                <span className="text-[10px] text-slate-500">Auto-syncs live</span>
              </div>
            </GlowCard>
          </div>
        </div>
      </div>
    </section>
  )
}
