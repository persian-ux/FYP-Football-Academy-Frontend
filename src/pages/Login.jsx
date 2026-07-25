import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import LoadingScreen from '@/components/LoadingScreen'
import { loginUser } from '@/redux/api/auth'
import { setCredentials, setError, clearError } from '@/redux/slices/authSlice'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (error) dispatch(clearError())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    dispatch(clearError())

    // Basic validation
    const errors = {}
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!formData.password) errors.password = 'Password is required'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      })

      if (response.success) {
        const tokens = response.data.tokens || {
          access: response.data.access,
          refresh: response.data.refresh,
        }
        const user = response.data.user || response.data

        localStorage.setItem('auth_tokens', JSON.stringify(tokens))
        localStorage.setItem('auth_user', JSON.stringify(user))

        dispatch(setCredentials({ user, tokens }))
        toast.success(response.message || 'Login successful!')
        navigate('/dashboard', { replace: true })
      } else {
        // Backend returned success=false with validation errors
        if (response.errors) {
          setFieldErrors(response.errors)
        }
        dispatch(setError(response.message || 'Login failed'))
        toast.error(response.message || 'Login failed')
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Login failed. Please try again.'

      if (errData?.errors) {
        setFieldErrors(errData.errors)
      }

      dispatch(setError(message))
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0f1419]">
      {/* Left side — image / illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#0a1628]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <img
                src="/logo.png"
                alt="Sportsphere Academy"
                className="w-24 h-24 mx-auto mb-6 brightness-0 invert opacity-80"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Welcome Back to
              <span className="block bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-300 bg-clip-text text-transparent">
                Sportsphere Academy
              </span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Your premier football training platform. Track your progress,
              connect with coaches, and elevate your game to the next level.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">50+</div>
                <div className="text-xs text-gray-500 mt-1">Training Programs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">10k+</div>
                <div className="text-xs text-gray-500 mt-1">Active Athletes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">200+</div>
                <div className="text-xs text-gray-500 mt-1">Expert Coaches</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-8">
              {/* Mobile logo */}
              <div className="lg:hidden flex justify-center mb-6">
                <img
                  src="/logo.png"
                  alt="Sportsphere Academy"
                  className="w-16 h-16 brightness-0 invert opacity-80"
                />
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Sign In</h2>
                <p className="text-gray-400 mt-1 text-sm">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-11 ${
                      fieldErrors.email ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-11 ${
                      fieldErrors.password ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card/40 px-3 text-gray-500">or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <GoogleSignInButton text="Sign in with Google" />

              <p className="text-center text-sm text-gray-400 mt-6">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

