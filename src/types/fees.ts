/**
 * Fee module TypeScript types.
 *
 * These mirror the backend `/api/v1/fees/**` contract exactly.
 * The main UI consumes `StudentFeeRow` from `GET /api/v1/fees/students/`.
 */

/** Allowed fee statuses, always lowercase strings. */
export type FeeStatus = 'paid' | 'unpaid' | 'pending' | 'overdue'

/**
 * A student with their fee status.
 * Returned by `GET /api/v1/fees/students/`.
 */
export interface StudentFeeRow {
  id: number
  player_id: number
  user_id: number
  student_name: string
  email: string
  phone?: string
  academy_group?: string
  assigned_sport?: string
  amount: string
  status: FeeStatus
  fee_id?: number | null
  due_date?: string | null
}

/**
 * A single fee record.
 * Returned by `GET /api/v1/fees/` and `GET /api/v1/fees/{id}/`.
 */
export interface FeeRecord {
  id: number
  player: number
  amount: string
  status: FeeStatus
  due_date?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Payload for creating a fee record (`POST /api/v1/fees/`).
 */
export interface CreateFeePayload {
  player: number
  amount: string
  status: FeeStatus
  due_date: string | null
}

/**
 * Payload for updating a fee record (`PATCH /api/v1/fees/{id}/`).
 */
export interface UpdateFeePayload {
  amount?: string
  status?: FeeStatus
  due_date?: string | null
}

/**
 * Unified API response envelope used across the backend.
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  errors: string[] | Record<string, string[]>
}