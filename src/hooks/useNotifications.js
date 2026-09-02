import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getStudentsWithFeeStatus } from '@/services/feeService'
import { listUpcomingMatches, formatDateTime } from '@/services/schedulingService'
import { isAdminUser, isPlayerUser } from '@/lib/admin'

const NOTIF_STORAGE_KEY = 'fa_notifications_read_v1'

export function useNotifications() {
  const { user, isAuthenticated } = useSelector((state) => state.auth) || {}
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Persist read IDs to localStorage
  const markAsRead = useCallback((id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save read notifications', e)
      }
      return updated
    })
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const allIds = prev.map((n) => n.id)
      setReadIds(allIds)
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(allIds))
      } catch (e) {
        console.error('Failed to save read notifications', e)
      }
      return prev
    })
  }, [])

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const fetchAndBuildNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const list = []

    try {
      // 1. Fetch Upcoming Matches
      try {
        const matchesRes = await listUpcomingMatches({ page: 1, limit: 5 })
        const rawMatches = Array.isArray(matchesRes)
          ? matchesRes
          : matchesRes?.data?.results || matchesRes?.data || []

        if (rawMatches.length > 0) {
          const nextMatch = rawMatches[0]
          const homeTeam = nextMatch.home_team_detail?.name || nextMatch.home_team || 'Home Team'
          const awayTeam = nextMatch.away_team_detail?.name || nextMatch.away_team || 'Away Team'
          const matchTime = nextMatch.match_date ? formatDateTime(nextMatch.match_date) : 'TBD'
          const venue = nextMatch.venue ? ` at ${nextMatch.venue}` : ''

          list.push({
            id: `match-${nextMatch.id || 'next'}`,
            category: 'match',
            title: 'Upcoming Match Alert',
            message: `Next Match: ${homeTeam} vs ${awayTeam}${venue} on ${matchTime}.`,
            severity: 'info',
            timestamp: new Date(nextMatch.match_date || Date.now()).toISOString(),
            raw: nextMatch,
            link: isPlayerUser(user) ? '/dashboard?section=matches' : '/scheduling',
          })
        }
      } catch (err) {
        console.warn('Matches notification fetch error:', err)
      }

      // 2. Fetch Fee Status Notifications
      try {
        const isAdmin = isAdminUser(user)

        if (isAdmin) {
          // Admin View: Check overall unpaid students
          const feesData = await getStudentsWithFeeStatus()
          const students = Array.isArray(feesData)
            ? feesData
            : feesData?.data?.results || feesData?.data || []

          const unpaidStudents = students.filter(
            (s) => s.fee_status === 'unpaid' || s.fee_status === 'overdue'
          )

          if (unpaidStudents.length > 0) {
            list.push({
              id: 'fee-admin-summary',
              category: 'fee',
              title: 'Fee Status Alert (Admin)',
              message: `${unpaidStudents.length} student(s) currently have UNPAID or OVERDUE academy fees.`,
              severity: 'warning',
              timestamp: new Date().toISOString(),
              link: '/admin/fees',
            })
          } else {
            list.push({
              id: 'fee-admin-all-paid',
              category: 'fee',
              title: 'Fee Status Summary',
              message: 'All registered students are up to date on fee payments.',
              severity: 'success',
              timestamp: new Date().toISOString(),
              link: '/admin/fees',
            })
          }
        } else {
          // Student / Player View: Find fee status for current user
          const studentFeesRes = await getStudentsWithFeeStatus()
          const students = Array.isArray(studentFeesRes)
            ? studentFeesRes
            : studentFeesRes?.data?.results || studentFeesRes?.data || []

          // Match by user ID or email
          const currentStudentFee = students.find(
            (s) => s.id === user?.id || s.email?.toLowerCase() === user?.email?.toLowerCase()
          )

          if (currentStudentFee) {
            const status = (currentStudentFee.fee_status || 'unpaid').toLowerCase()
            const dueDate = currentStudentFee.due_date
              ? new Date(currentStudentFee.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null

            if (status === 'paid') {
              list.push({
                id: `fee-user-${user?.id || 'current'}`,
                category: 'fee',
                title: 'Fee Payment Verified',
                message: 'Your monthly academy tuition fee is PAID. Thank you!',
                severity: 'success',
                timestamp: new Date().toISOString(),
                status: 'paid',
                amount: currentStudentFee.amount,
                link: isAdmin ? '/admin/fees' : '/dashboard?section=fees',
              })
            } else {
              list.push({
                id: `fee-user-${user?.id || 'current'}`,
                category: 'fee',
                title: 'Fee Payment Due Alert',
                message: `Your academy tuition fee status is currently ${status.toUpperCase()}${
                  dueDate ? ` (Due: ${dueDate})` : ''
                }. Please resolve payment soon.`,
                severity: 'urgent',
                timestamp: new Date().toISOString(),
                status: status,
                amount: currentStudentFee.amount,
                link: isAdmin ? '/admin/fees' : '/dashboard?section=fees',
              })
            }
          } else {
            // Default notification if student record not directly in fee table
            list.push({
              id: `fee-user-default-${user?.id || 'current'}`,
              category: 'fee',
              title: 'Fee Status Reminder',
              message: 'Please check your fee dashboard to confirm your monthly payment status.',
              severity: 'warning',
              timestamp: new Date().toISOString(),
              status: 'unpaid',
              link: isAdmin ? '/admin/fees' : '/dashboard?section=fees',
            })
          }
        }
      } catch (err) {
        console.warn('Fee notification fetch error:', err)
      }

      // 3. Add Academy System Announcements / Welcome
      list.push({
        id: 'system-announcement-1',
        category: 'system',
        title: 'Academy Training Session',
        message: 'Regular squad training session scheduled for this weekend. Bring full kit.',
        severity: 'info',
        timestamp: new Date().toISOString(),
        link: isAdmin ? '/sections' : '/dashboard?section=matches',
      })

      setNotifications(list)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Could not load notifications')
    } finally {
      setLoading(false)
    }
  }, [user, isAuthenticated])

  useEffect(() => {
    fetchAndBuildNotifications()
  }, [fetchAndBuildNotifications])

  // Attach `isRead` flag to each notification item
  const formattedNotifications = notifications.map((item) => ({
    ...item,
    isRead: readIds.includes(item.id),
  }))

  const unreadCount = formattedNotifications.filter((n) => !n.isRead).length

  return {
    notifications: formattedNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    clearNotification,
    refreshNotifications: fetchAndBuildNotifications,
  }
}
