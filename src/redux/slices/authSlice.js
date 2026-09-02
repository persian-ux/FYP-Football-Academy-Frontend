import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import {
  loginUser,
  registerUser,
  logoutUser,
  fetchProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../api/auth'

// =============== Async Thunks ===============

export const login = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await loginUser(payload)
      if (response.success) {
        // Store tokens
        const tokens = {
          access: response.data.access,
          refresh: response.data.refresh,
        }
        sessionStorage.setItem('auth_tokens', JSON.stringify(tokens))
        sessionStorage.setItem('auth_user', JSON.stringify(response.data.user || response.data))
        return response.data
      }
      return rejectWithValue(response)
    } catch (err) {
      const errorData = err.response?.data || {
        success: false,
        message: err.message || 'Network error',
        errors: null,
      }
      return rejectWithValue(errorData)
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await registerUser(payload)
      if (response.success) {
        const tokens = {
          access: response.data.access,
          refresh: response.data.refresh,
        }
        sessionStorage.setItem('auth_tokens', JSON.stringify(tokens))
        sessionStorage.setItem('auth_user', JSON.stringify(response.data.user || response.data))
        return response.data
      }
      return rejectWithValue(response)
    } catch (err) {
      const errorData = err.response?.data || {
        success: false,
        message: err.message || 'Network error',
        errors: null,
      }
      return rejectWithValue(errorData)
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutUser()
      return response
    } catch (err) {
      const errorData = err.response?.data || {
        success: false,
        message: err.message || 'Network error',
        errors: null,
      }
      return rejectWithValue(errorData)
    } finally {
      // Always clear local tokens regardless of backend response
      sessionStorage.removeItem('auth_tokens')
      sessionStorage.removeItem('auth_user')
    }
  }
)

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchProfile()
      if (response.success) {
        sessionStorage.setItem('auth_user', JSON.stringify(response.data))
        return response.data
      }
      return rejectWithValue(response)
    } catch (err) {
      const errorData = err.response?.data || {
        success: false,
        message: err.message || 'Network error',
        errors: null,
      }
      return rejectWithValue(errorData)
    }
  }
)

export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await changePassword(payload)
      if (response.success) {
        return response
      }
      return rejectWithValue(response)
    } catch (err) {
      const errorData = err.response?.data || {
        success: false,
        message: err.message || 'Network error',
        errors: null,
      }
      return rejectWithValue(errorData)
    }
  }
)

export const requestForgotPassword = createAsyncThunk(
  'auth/requestForgotPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await forgotPassword(payload)
      if (response.success) {
        return response
      }
      return rejectWithValue(response)
    } catch (err) {
      const errorData = err.response?.data || {
        success: false,
        message: err.message || 'Network error',
        errors: null,
      }
      return rejectWithValue(errorData)
    }
  }
)

export const requestResetPassword = createAsyncThunk(
  'auth/requestResetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await resetPassword(payload)
      if (response.success) {
        return response
      }
      return rejectWithValue(response)
    } catch (err) {
      const errorData = err.response?.data || {
        success: false,
        message: err.message || 'Network error',
        errors: null,
      }
      return rejectWithValue(errorData)
    }
  }
)

// =============== Initial State ===============

function getInitialUser() {
  try {
    const stored = sessionStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function getInitialTokens() {
  try {
    const stored = sessionStorage.getItem('auth_tokens')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const initialState = {
  user: getInitialUser(),
  tokens: getInitialTokens(),
  isAuthenticated: !!getInitialTokens(),
  loading: false,
  error: null,
  errors: null, // Field-level validation errors
  successMessage: null,
}

// =============== Slice ===============

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthState(state) {
      state.error = null
      state.errors = null
      state.successMessage = null
    },
    clearTokensAndUser(state) {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      state.errors = null
      state.successMessage = null
      sessionStorage.removeItem('auth_tokens')
      sessionStorage.removeItem('auth_user')
    },
    setUser(state, action) {
      state.user = action.payload
      state.isAuthenticated = true
    },
    restoreSession(state, action) {
      const { user, tokens } = action.payload
      state.user = user
      state.tokens = tokens
      state.isAuthenticated = true
      state.loading = false
      state.error = null
      state.errors = null
    },
    setCredentials(state, action) {
      const { user, tokens } = action.payload
      state.user = user
      state.tokens = tokens
      state.isAuthenticated = true
      state.loading = false
      state.error = null
      state.errors = null
    },
    setError(state, action) {
      state.error = action.payload
      state.loading = false
    },
    clearError(state) {
      state.error = null
      state.errors = null
    },
  },
  extraReducers: (builder) => {
    // ===== Login =====
    builder.addCase(login.pending, (state) => {
      state.loading = true
      state.error = null
      state.errors = null
    })
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user || action.payload
      state.error = null
      state.errors = null
    })
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false
      state.isAuthenticated = false
      const payload = action.payload
      state.error = payload?.message || 'Login failed'
      state.errors = payload?.errors || null
    })

    // ===== Register =====
    builder.addCase(register.pending, (state) => {
      state.loading = true
      state.error = null
      state.errors = null
    })
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user || action.payload
      state.error = null
      state.errors = null
    })
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false
      state.isAuthenticated = false
      const payload = action.payload
      state.error = payload?.message || 'Registration failed'
      state.errors = payload?.errors || null
    })

    // ===== Logout =====
    builder.addCase(logout.pending, (state) => {
      state.loading = true
    })
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      state.errors = null
      state.successMessage = null
    })
    builder.addCase(logout.rejected, (state) => {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      state.errors = null
    })

    // ===== Get Profile =====
    builder.addCase(getProfile.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(getProfile.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload
    })
    builder.addCase(getProfile.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload?.message || 'Failed to load profile'
    })

    // ===== Change Password =====
    builder.addCase(updatePassword.pending, (state) => {
      state.loading = true
      state.error = null
      state.errors = null
      state.successMessage = null
    })
    builder.addCase(updatePassword.fulfilled, (state, action) => {
      state.loading = false
      state.successMessage = action.payload?.message || 'Password changed successfully'
      state.error = null
      state.errors = null
    })
    builder.addCase(updatePassword.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload?.message || 'Failed to change password'
      state.errors = action.payload?.errors || null
    })

    // ===== Forgot Password =====
    builder.addCase(requestForgotPassword.pending, (state) => {
      state.loading = true
      state.error = null
      state.errors = null
      state.successMessage = null
    })
    builder.addCase(requestForgotPassword.fulfilled, (state, action) => {
      state.loading = false
      state.successMessage = action.payload?.message || 'Reset email sent if account exists'
      state.error = null
    })
    builder.addCase(requestForgotPassword.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload?.message || 'Failed to send reset email'
      state.errors = action.payload?.errors || null
    })

    // ===== Reset Password =====
    builder.addCase(requestResetPassword.pending, (state) => {
      state.loading = true
      state.error = null
      state.errors = null
      state.successMessage = null
    })
    builder.addCase(requestResetPassword.fulfilled, (state, action) => {
      state.loading = false
      state.successMessage = action.payload?.message || 'Password reset successfully'
      state.error = null
    })
    builder.addCase(requestResetPassword.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload?.message || 'Failed to reset password'
      state.errors = action.payload?.errors || null
    })
  },
})

export const { clearAuthState, clearTokensAndUser, setUser, restoreSession, setCredentials, setError, clearError } = authSlice.actions
export default authSlice.reducer

