import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react'
import { changePassword } from '@/redux/api/auth'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOldPw, setShowOldPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setError('')

    // Validation
    const errors = {}
    if (!formData.old_password) errors.old_password = 'Current password is required'
    if (!formData.new_password) errors.new_password = 'New password is required'
    else if (formData.new_password.length < 8) errors.new_password = 'Password must be at least 8 characters'
    if (!formData.confirm_new_password) errors.confirm_new_password = 'Please confirm your new password'
    else if (formData.new_password !== formData.confirm_new_password) {
      errors.confirm_new_password = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const response = await changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
        confirm_new_password: formData.confirm_new_password,
      })

      if (response.success) {
        toast.success(response.message || 'Password changed successfully!')
        navigate('/profile')
      } else {
        if (response.errors) setFieldErrors(response.errors)
        setError(response.message || 'Failed to change password')
        toast.error(response.message || 'Failed to change password')
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Failed to change password'
      if (errData?.errors) setFieldErrors(errData.errors)
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-blue-500/10">
                <KeyRound className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-xl text-white">Change Password</CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Update your account password
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password" className="text-gray-300">Current Password</Label>
                <div className="relative">
                  <Input
                    id="old_password"
                    name="old_password"
                    type={showOldPw ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={formData.old_password}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-11 pr-10 ${
                      fieldErrors.old_password ? 'border-destructive' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPw(!showOldPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.old_password && (
                  <p className="text-xs text-destructive">{fieldErrors.old_password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password" className="text-gray-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    name="new_password"
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={formData.new_password}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-11 pr-10 ${
                      fieldErrors.new_password ? 'border-destructive' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.new_password && (
                  <p className="text-xs text-destructive">{fieldErrors.new_password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_new_password" className="text-gray-300">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_new_password"
                    name="confirm_new_password"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={formData.confirm_new_password}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-11 pr-10 ${
                      fieldErrors.confirm_new_password ? 'border-destructive' : ''
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
                {fieldErrors.confirm_new_password && (
                  <p className="text-xs text-destructive">{fieldErrors.confirm_new_password}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

