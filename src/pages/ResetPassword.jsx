import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { resetPassword } from '@/redux/api/auth'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [formData, setFormData] = useState({
    password: '',
    confirm_password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setError('')

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.')
      return
    }

    const errors = {}
    if (!formData.password) {
      errors.password = 'New password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!formData.confirm_password) {
      errors.confirm_password = 'Please confirm your new password'
    } else if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const response = await resetPassword({
        token,
        password: formData.password,
        confirm_password: formData.confirm_password,
      })

      if (response.success) {
        setSuccess(true)
        toast.success(response.message || 'Password has been reset successfully!')
      } else {
        if (response.errors) setFieldErrors(response.errors)
        setError(response.message || 'Failed to reset password')
        toast.error(response.message || 'Failed to reset password')
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Failed to reset password'
      if (errData?.errors) setFieldErrors(errData.errors)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password Reset Successful</h2>
              <p className="text-gray-400 text-sm mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full h-11 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
              >
                Sign In
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-blue-500/10">
                <KeyRound className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-xl text-white">Reset Password</CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Enter your new password
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!token && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>
                  No reset token found. Please use the link from your email or{' '}
                  <Link to="/forgot-password" className="underline font-medium">request a new one</Link>.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-11 pr-10 ${
                      fieldErrors.password ? 'border-destructive' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password" className="text-gray-300">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-11 pr-10 ${
                      fieldErrors.confirm_password ? 'border-destructive' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="text-xs text-destructive">{fieldErrors.confirm_password}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
                disabled={loading || !token}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

