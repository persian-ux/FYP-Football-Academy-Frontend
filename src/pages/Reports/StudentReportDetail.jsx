import { User, Shirt, Target, Star, CalendarDays, Clock3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const STAT_ROWS = [
  { name: 'goals', label: 'Goals' },
  { name: 'assists', label: 'Assists' },
  { name: 'minutes_played', label: 'Minutes Played' },
  { name: 'fouls', label: 'Fouls' },
  { name: 'yellow_cards', label: 'Yellow Cards' },
  { name: 'red_cards', label: 'Red Cards' },
  { name: 'shots', label: 'Shots' },
  { name: 'passes_completed', label: 'Passes Completed' },
  { name: 'tackles', label: 'Tackles' },
  { name: 'saves', label: 'Saves' },
]

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDateOnly(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-gray-500">{label}</Label>
      <div className="text-sm text-white">{children}</div>
    </div>
  )
}

function getStudentName(report) {
  if (report?.student_details?.full_name) return report.student_details.full_name
  return report?.student_details?.email || report?.student_details?.user?.full_name || '—'
}

/**
 * StudentReportDetail — read-only details for a student report.
 * @param {Object} props
 * @param {Object|null} report - The report object.
 */
export default function StudentReportDetail({ report }) {
  if (!report) return null
  const sd = report.student_details
  const md = report.match_details
return (
    <div className="space-y-4">
      {/* Student + Match summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 rounded-xl border border-border/40 bg-white/5 p-4">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <User className="h-3.5 w-3.5 text-blue-400" /> Student
          </p>
          <p className="text-sm font-semibold text-white">{getStudentName(report)}</p>
          {sd?.email && <p className="text-xs text-gray-400">{sd.email}</p>}
          <div className="flex flex-wrap gap-1.5">
            {sd?.academy_group && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                {sd.academy_group}
              </Badge>
            )}
            {sd?.assigned_sport && (
              <Badge variant="secondary" className="bg-white/5 text-gray-300 border-border/40">
                {sd.assigned_sport}
              </Badge>
            )}
            {sd?.status && (
              <Badge
                variant="secondary"
                className={cn(
                  sd.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-destructive/10 text-destructive border-destructive/20',
                  'capitalize'
                )}
              >
                {sd.status}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-xs font-medium text-gray-400">
            <Shirt className="h-3.5 w-3.5 text-blue-400" /> Match
          </p>
          {md ? (
            <>
              <p className="text-sm font-semibold text-white">
                {md.home_team_name || md.home_team_details?.name || 'Home'} vs{' '}
                {md.away_team_name || md.away_team_details?.name || 'Away'}
              </p>
              {md.match_date && (
                <p className="text-xs text-gray-400">
                  <CalendarDays className="h-3 w-3 inline mr-1" />
                  {formatDateTime(md.match_date)}
                </p>
              )}
              {md.venue && <p className="text-xs text-gray-400">{md.venue}</p>}
              {md.status && (
                <Badge variant="secondary" className="bg-white/5 text-gray-300 border-border/40 capitalize">
                  {md.status}
                </Badge>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No match linked</p>
          )}
        </div>
      </div>

      {/* Position + Rating + Report date + Created by */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border/40 bg-white/5 p-4">
        <Field label="Position">{report.position || '—'}</Field>
        <Field label="Report Date">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3 text-gray-500" />
            {formatDateOnly(report.report_date)}
          </span>
        </Field>
        <div className="space-y-1">
          <Label className="text-gray-500">Rating</Label>
          <div className="text-sm text-white">
            {report.rating != null ? (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                <span className="font-semibold">{report.rating}</span>
                <span className="text-gray-500">/ 10</span>
              </span>
            ) : (
              '—'
            )}
          </div>
        </div>
        <Field label="Created By">{report.created_by_details?.full_name || '—'}</Field>
      </div>
{/* Performance stats */}
      <div className="rounded-xl border border-border/40 bg-white/5 p-4">
        <p className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-3">
          <Target className="h-3.5 w-3.5 text-blue-400" /> Match Performance Stats
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STAT_ROWS.map((row) => (
            <div key={row.name} className="rounded-lg bg-white/5 px-3 py-2 text-center border border-border/30">
              <p className="text-sm font-semibold text-white">{report[row.name] ?? 0}</p>
              <p className="text-[11px] text-gray-500">{row.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary + Coach remarks */}
      {(report.summary || report.coach_remarks) && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/40 bg-white/5 p-4">
          {report.summary && (
            <div className="space-y-1">
              <Label className="text-gray-500">Summary</Label>
              <p className="text-sm text-white whitespace-pre-line">{report.summary}</p>
            </div>
          )}
          {report.coach_remarks && (
            <div className="space-y-1">
              <Label className="text-gray-500">Coach Remarks</Label>
              <p className="text-sm text-white whitespace-pre-line">{report.coach_remarks}</p>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-white/5 px-4 py-3">
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <Clock3 className="h-3 w-3" />
          Created {formatDateTime(report.created_at)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <Clock3 className="h-3 w-3" />
          Updated {formatDateTime(report.updated_at)}
        </span>
      </div>
    </div>
  )
}