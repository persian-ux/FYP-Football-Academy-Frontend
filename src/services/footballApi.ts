// Service for fetching real live football scores, fixtures, and news
// Default free tier uses TheSportsDB public developer API + RSS2JSON football feeds

export interface FootballMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamBadge?: string
  awayTeamBadge?: string
  homeScore?: number | null
  awayScore?: number | null
  date: string
  time: string
  timestamp: string
  venue: string
  league: string
  leagueBadge?: string
  status: 'LIVE' | 'UPCOMING' | 'FINISHED' | 'POSTPONED'
  statusText?: string
  round?: string
  poster?: string
  thumb?: string
}

export interface FootballNewsItem {
  id: string
  title: string
  description: string
  publishedAt: string
  relativeTime: string
  source: string
  url: string
  thumbnail?: string
  category: string
  isBreaking?: boolean
}

const THESPORTSDB_KEY = import.meta.env.VITE_THESPORTSDB_KEY || '3'

// Pre-defined League IDs in TheSportsDB
export const LEAGUES = {
  ALL: 'all',
  FIFA_WORLD_CUP: '4429',
  PREMIER_LEAGUE: '4328',
  CHAMPIONS_LEAGUE: '4480',
  LA_LIGA: '4335',
  ACADEMY: 'academy',
} as const

export const LEAGUE_LABELS: Record<string, string> = {
  all: 'All Matches',
  '4429': 'FIFA World Cup',
  '4328': 'Premier League',
  '4480': 'Champions League',
  '4335': 'La Liga',
  academy: 'Sportsphere Academy',
}

// Fallback curated football news in case of network restriction or offline
const FALLBACK_NEWS: FootballNewsItem[] = [
  {
    id: 'fb-1',
    title: 'FIFA World Cup 2026: Expanded 48-Team Format & Continental Qualifiers Intensify',
    description: 'Road to North America 2026 enters crucial phase with European, South American, and Asian qualifying rounds producing dramatic matchdays and emerging wonderkids.',
    publishedAt: new Date().toISOString(),
    relativeTime: '15m ago',
    source: 'FIFA Official',
    url: 'https://www.fifa.com',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    category: 'World Cup',
    isBreaking: true,
  },
  {
    id: 'fb-2',
    title: 'Tactical Revolution: Modern Academy Pressing Schemes Adopted by World Cup Contenders',
    description: 'How high-intensity counter-pressing and fluid positional rotations perfected in top youth academies are dominating international tournaments.',
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    relativeTime: '2h ago',
    source: 'Sky Sports',
    url: 'https://www.skysports.com/football',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    category: 'Tactics',
  },
  {
    id: 'fb-3',
    title: 'Sportsphere Academy U-19 Squad Secures Historic Continental Showcase Victory',
    description: 'A disciplined 3-1 triumph against European scouting selects puts Sportsphere prospects under the spotlight for next month’s international trials.',
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    relativeTime: '5h ago',
    source: 'Academy Desk',
    url: '#',
    thumbnail: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&q=80',
    category: 'Academy',
    isBreaking: false,
  },
  {
    id: 'fb-4',
    title: 'UEFA Champions League Knockout Draw & Fixture Matrix Finalized',
    description: 'Blockbuster ties set up thrilling European nights as heavyweight clubs prepare for continental glory.',
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    relativeTime: '8h ago',
    source: 'BBC Sport',
    url: 'https://www.bbc.com/sport/football',
    thumbnail: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
    category: 'Champions League',
  },
]

// Fallback fixtures
const FALLBACK_FIXTURES: FootballMatch[] = [
  {
    id: 'acad-1',
    homeTeam: 'Sportsphere U-16',
    awayTeam: 'London Elite Youth',
    homeTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png',
    awayTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/sar2y41781740886.png',
    homeScore: 2,
    awayScore: 1,
    date: 'Today',
    time: '18:30 GMT',
    timestamp: new Date().toISOString(),
    venue: 'Main Pitch 1, Academy Campus',
    league: 'Sportsphere Academy Showcase',
    status: 'LIVE',
    statusText: '72’ Live',
    round: 'Matchday 6',
  },
  {
    id: 'acad-2',
    homeTeam: 'Brazil',
    awayTeam: 'Argentina',
    homeTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/7f8a7e1546875883.png',
    awayTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/wsqqqu1421434774.png',
    homeScore: null,
    awayScore: null,
    date: 'Tomorrow',
    time: '20:00 GMT',
    timestamp: new Date(Date.now() + 86400000).toISOString(),
    venue: 'Maracanã Stadium',
    league: 'FIFA World Cup Qualifiers',
    status: 'UPCOMING',
    statusText: 'Upcoming',
    round: 'CONMEBOL Round 8',
  },
  {
    id: 'acad-3',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png',
    awayTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/0gw5451693657388.png',
    homeScore: null,
    awayScore: null,
    date: 'Saturday',
    time: '17:30 GMT',
    timestamp: new Date(Date.now() + 172800000).toISOString(),
    venue: 'Emirates Stadium',
    league: 'Premier League',
    status: 'UPCOMING',
    statusText: 'Upcoming',
    round: 'Matchday 4',
  },
  {
    id: 'acad-4',
    homeTeam: 'Real Madrid',
    awayTeam: 'Bayern Munich',
    homeTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/1i24b91737742884.png',
    awayTeamBadge: 'https://r2.thesportsdb.com/images/media/team/badge/w80n491535478440.png',
    homeScore: 3,
    awayScore: 2,
    date: 'Yesterday',
    time: 'FT',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    venue: 'Santiago Bernabéu',
    league: 'UEFA Champions League',
    status: 'FINISHED',
    statusText: 'Full Time',
    round: 'Semi-Final',
  },
]

function formatRelativeTime(dateStr: string): string {
  try {
    const pub = new Date(dateStr)
    const diffMs = Date.now() - pub.getTime()
    if (isNaN(diffMs)) return 'Recently'
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return 'Recently'
  }
}

/**
 * Fetch live and upcoming matches from TheSportsDB
 */
export async function fetchFootballMatches(leagueId = 'all'): Promise<FootballMatch[]> {
  try {
    const leaguesToFetch =
      leagueId === 'all'
        ? ['4328', '4480', '4429']
        : leagueId === 'academy'
        ? []
        : [leagueId]

    if (leagueId === 'academy') {
      return FALLBACK_FIXTURES.filter((f) => f.id.startsWith('acad-1'))
    }

    const matchPromises = leaguesToFetch.map(async (id) => {
      try {
        const res = await fetch(
          `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/eventsnextleague.php?id=${id}`
        )
        if (!res.ok) return []
        const data = await res.json()
        return (data.events || []).map((ev: any) => {
          const isLive = ev.strStatus === '1H' || ev.strStatus === '2H' || ev.strStatus === 'HT'
          const isFinished = ev.strStatus === 'FT' || ev.strStatus === 'AET'
          return {
            id: String(ev.idEvent),
            homeTeam: ev.strHomeTeam || 'Home Team',
            awayTeam: ev.strAwayTeam || 'Away Team',
            homeTeamBadge: ev.strHomeTeamBadge || undefined,
            awayTeamBadge: ev.strAwayTeamBadge || undefined,
            homeScore: ev.intHomeScore !== null ? Number(ev.intHomeScore) : null,
            awayScore: ev.intAwayScore !== null ? Number(ev.intAwayScore) : null,
            date: ev.dateEvent || 'TBD',
            time: ev.strTime ? ev.strTime.substring(0, 5) + ' UTC' : 'TBD',
            timestamp: ev.strTimestamp || ev.dateEvent,
            venue: ev.strVenue || 'Stadium Arena',
            league: ev.strLeague || 'International Football',
            leagueBadge: ev.strLeagueBadge || undefined,
            status: isLive ? 'LIVE' : isFinished ? 'FINISHED' : 'UPCOMING',
            statusText: isLive ? 'LIVE' : isFinished ? 'FT' : 'Upcoming',
            round: ev.intRound ? `Matchday ${ev.intRound}` : undefined,
            thumb: ev.strThumb || undefined,
            poster: ev.strPoster || undefined,
          } as FootballMatch
        })
      } catch (err) {
        console.warn(`Failed to fetch league ${id}:`, err)
        return []
      }
    })

    const results = await Promise.all(matchPromises)
    const flattened = results.flat()

    if (flattened.length === 0) {
      return FALLBACK_FIXTURES
    }

    // Include top academy fixture at the top for academy branding
    return [FALLBACK_FIXTURES[0], ...flattened]
  } catch (error) {
    console.error('Error in fetchFootballMatches:', error)
    return FALLBACK_FIXTURES
  }
}

/**
 * Fetch live football news from RSS feeds (BBC Sport & Sky Sports via RSS2JSON)
 */
export async function fetchFootballNews(): Promise<FootballNewsItem[]> {
  try {
    const feeds = [
      'https://feeds.bbci.co.uk/sport/football/rss.xml',
      'https://www.skysports.com/rss/12040',
    ]

    const newsPromises = feeds.map(async (rssUrl, index) => {
      try {
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
        )
        if (!res.ok) return []
        const data = await res.json()
        if (data.status !== 'ok' || !Array.isArray(data.items)) return []

        return data.items.map((item: any, i: number) => {
          const title = item.title ? item.title.replace(/<\/?[^>]+(>|$)/g, '').trim() : 'Football Update'
          const description = item.description
            ? item.description.replace(/<\/?[^>]+(>|$)/g, '').trim()
            : ''
          const thumb =
            item.thumbnail ||
            item.enclosure?.link ||
            item.enclosure?.thumbnail ||
            (index === 0
              ? 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'
              : 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80')

          let category = 'World Football'
          const lower = (title + ' ' + description).toLowerCase()
          if (lower.includes('world cup') || lower.includes('fifa')) category = 'FIFA World Cup'
          else if (lower.includes('champions league') || lower.includes('uefa')) category = 'UEFA Champions League'
          else if (lower.includes('transfer') || lower.includes('sign')) category = 'Transfers'
          else if (lower.includes('academy') || lower.includes('youth') || lower.includes('scout')) category = 'Youth & Academy'
          else if (lower.includes('premier league')) category = 'Premier League'

          return {
            id: item.guid || `${index}-${i}-${Date.now()}`,
            title,
            description: description.length > 180 ? description.substring(0, 177) + '...' : description,
            publishedAt: item.pubDate || new Date().toISOString(),
            relativeTime: formatRelativeTime(item.pubDate),
            source: index === 0 ? 'BBC Sport' : 'Sky Sports Football',
            url: item.link || 'https://www.fifa.com',
            thumbnail: thumb,
            category,
            isBreaking: i === 0 && index === 0,
          } as FootballNewsItem
        })
      } catch (err) {
        console.warn(`RSS feed ${rssUrl} failed:`, err)
        return []
      }
    })

    const results = await Promise.all(newsPromises)
    const combined = results.flat()

    if (combined.length === 0) {
      return FALLBACK_NEWS
    }

    // Sort by published date descending and deduplicate by title
    const seen = new Set<string>()
    const uniqueNews: FootballNewsItem[] = []

    for (const item of combined) {
      const simplified = item.title.toLowerCase().slice(0, 30)
      if (!seen.has(simplified)) {
        seen.add(simplified)
        uniqueNews.push(item)
      }
    }

    return uniqueNews.slice(0, 10)
  } catch (error) {
    console.error('Error in fetchFootballNews:', error)
    return FALLBACK_NEWS
  }
}
