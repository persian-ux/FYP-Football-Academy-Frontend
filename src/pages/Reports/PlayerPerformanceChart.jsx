import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import { Loader2, Activity, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listStudentReports } from '@/services/reportService'
import { deviceSupports3D } from '@/hooks/useDeviceCapability'
import PerformanceChart3D from './PerformanceChart3D'

// Radar metrics — each has a display label, a typical max scale (used to
// normalise to 0-100% so the radar stays readable across mixed units), and
// the report field it reads from.
const RADAR_METRICS = [
  { key: 'goals', label: 'Goals', max: 5 },
  { key: 'assists', label: 'Assists', max: 5 },
  { key: 'shots', label: 'Shots', max: 10 },
  { key: 'passes_completed', label: 'Passes', max: 50 },
  { key: 'tackles', label: 'Tackles', max: 10 },
  { key: 'minutes_played', label: 'Minutes', max: 90 },
  { key: 'rating', label: 'Rating', max: 10 },
]

const BAR_COLORS = {
  goals: '#3b82f6',
  assists: '#a855f7',
}

const RADAR_COLOR = '#3b82f6'

function toNum(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function shortDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-xl border border-border/40 bg-white/5 px-3 py-2 text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  )
}

/**
 * PlayerPerformanceChart — visualises student report performance data.
 *
 * When a player is selected this walks every page of their reports (via the
 * `player` query param) for a full history; otherwise it charts the current
 * page's reports passed in as `reports`.
 *
 * @param {Object} props
 * @param {Array} reports - The currently loaded reports (fallback + initial).
 * @param {Array} players - All player options for the selector.
 * @param {boolean} [loading] - Whether the parent list is loading.
 */
export default function PlayerPerformanceChart({ reports = [], players = [], loading = false }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('__all__')
  const [chartReports, setChartReports] = useState(reports)
  const [chartLoading, setChartLoading] = useState(false)

  const getPlayerLabel = (player) => {
    const user = player.user
    const name = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    return name || user?.email || player.full_name || `Player #${player.id}`
  }

  // Fetch the selected player's full report history across pages.
  useEffect(() => {
    let cancelled = false
    setChartLoading(true)

    async function run() {
      if (selectedPlayerId === '__all__') {
        if (!cancelled) {
          setChartReports(reports)
          setChartLoading(false)
        }
        return
      }

      const all = []
      let page = 1
      try {
        for (;;) {
          const response = await listStudentReports({ player: selectedPlayerId, page })
          if (!response?.success) break
          const results = response.data?.results || []
          all.push(...results)
          const total = response.data?.count ?? results.length
          if (results.length === 0 || all.length >= total) break
          page += 1
        }
      } catch {
        // fall through with whatever we collected
      }

      if (!cancelled) {
        setChartReports(all)
        setChartLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [selectedPlayerId, reports])

  const data = useMemo(() => {
    if (chartReports.length === 0) return { radar: [], bars: [], stats: null }
    const n = chartReports.length

    // Average each metric for the radar.
    const radar = RADAR_METRICS.map((m) => {
      const avg = chartReports.reduce((acc, r) => acc + toNum(r[m.key]), 0) / n
      const percent = Math.min(100, Math.round((avg / m.max) * 100))
      return {
        metric: m.key,
        label: m.label,
        max: m.max,
        avg: Number(avg.toFixed(1)),
        value: percent,
      }
    })

    // Goals & assists per report for the bar chart (most recent 10, newest right).
    const sorted = [...chartReports].sort(
      (a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0)
    )
    const recent = sorted.slice(0, 10).reverse()
    const bars = recent.map((r) => ({
      name: shortDate(r.report_date),
      reportId: r.id,
      goals: toNum(r.goals),
      assists: toNum(r.assists),
    }))

    const totalGoals = chartReports.reduce((acc, r) => acc + toNum(r.goals), 0)
    const totalAssists = chartReports.reduce((acc, r) => acc + toNum(r.assists), 0)
    const totalMinutes = chartReports.reduce((acc, r) => acc + toNum(r.minutes_played), 0)
    const avgRating = radar.find((m) => m.key === 'rating')?.avg || 0

    const stats = { totalGoals, totalAssists, totalMinutes, avgRating, count: n }

    return { radar, bars, stats }
  }, [chartReports])

  const selectedPlayerName = useMemo(() => {
    if (selectedPlayerId === '__all__' || players.length === 0) return null
    const player = players.find((p) => String(p.id) === String(selectedPlayerId))
    return player ? getPlayerLabel(player) : null
    }, [selectedPlayerId, players])

  // Render a real, animated 3D stage on WebGL-capable devices, falling
  // back to the 2D recharts version on mobile / low-power / no-JS support.
  const canRender3D = deviceSupports3D()
const radarTooltip = useCallback(
    ({ active, payload }) => {
      if (!active || !payload?.length) return null
      const point = payload[0]?.payload
      if (!point) return null
      return (
        <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 text-xs shadow-lg">
          <p className="font-medium text-white">{point.label}</p>
          <p className="text-gray-400">Avg {point.avg} / {point.max}</p>
        </div>
      )
    },
    []
  )

  const barTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border border-border/50 bg-popover px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-white">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-gray-300">
            {entry.name}: <span className="text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }, [])

  const isEmpty = !loading && !chartLoading && chartReports.length === 0

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Activity className="h-5 w-5 text-blue-400" />
          Player Performance
        </CardTitle>
        <Select value={selectedPlayerId} onValueChange={(v) => setSelectedPlayerId(v)}>
          <SelectTrigger className="bg-white/5 border-border/50 text-white h-10 w-full sm:w-64">
            <SelectValue
              placeholder={players.length ? 'All players in this view' : 'Loading players...'}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All players in this view</SelectItem>
            {players.map((player) => (
              <SelectItem key={player.id} value={String(player.id)}>
                {getPlayerLabel(player)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {(loading || chartLoading) && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="text-sm">Loading performance data...</span>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-500">
            <TrendingUp className="h-8 w-8 text-gray-600" />
            <p className="text-sm">
              No reports found
              {selectedPlayerName ? ` for ${selectedPlayerName}` : ''}.
            </p>
          </div>
        )}

        {!loading && !chartLoading && !isEmpty && data.stats && (
          <div className="space-y-5">
            {/* Summary stat chips */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatChip label="Reports" value={String(data.stats.count)} />
              <StatChip label="Goals" value={String(data.stats.totalGoals)} />
              <StatChip label="Assists" value={String(data.stats.totalAssists)} />
              <StatChip label="Minutes" value={String(data.stats.totalMinutes)} />
              <StatChip label="Avg Rating" value={String(data.stats.avgRating)} />
            </div>
            {canRender3D ? (
              <PerformanceChart3D
                radar={data.radar}
                bars={data.bars}
                playerName={selectedPlayerName}
              />
            ) : (
              <>
                {/* Radar — performance profile */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-400">
                Average Performance Profile
                {selectedPlayerName ? ` — ${selectedPlayerName}` : ''}
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.radar} outerRadius="75%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={{ fill: 'rgba(156,163,175,0.5)', fontSize: 10 }}
                    />
                    <Radar
                      name="Performance"
                      dataKey="value"
                      stroke={RADAR_COLOR}
                      fill={RADAR_COLOR}
                      fillOpacity={0.4}
                    />
                    <Tooltip content={radarTooltip} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar — goals & assists per report */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-400">
                Goals & Assists per Report
                {selectedPlayerName ? ` — ${selectedPlayerName}` : ''}
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.bars} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={barTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
                      formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
                    />
                    <Bar dataKey="goals" name="Goals" fill={BAR_COLORS.goals} radius={[3, 3, 0, 0]}>
                      {data.bars.map((entry) => (
                        <Cell key={entry.reportId} fill={BAR_COLORS.goals} />
                      ))}
                    </Bar>
                    <Bar dataKey="assists" name="Assists" fill={BAR_COLORS.assists} radius={[3, 3, 0, 0]}>
                      {data.bars.map((entry) => (
                        <Cell key={entry.reportId} fill={BAR_COLORS.assists} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
                                                                        </div>
            </>
          )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}