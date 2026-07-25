import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import GoogleSignInButton from '@/components/GoogleSignInButton'
import { registerUser } from '@/redux/api/auth'
import { setCredentials, setError, clearError } from '@/redux/slices/authSlice'

export default function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setAgreedToTerms(checked)
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (error) dispatch(clearError())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    dispatch(clearError())

    // Validation
    const errors = {}
    if (!formData.first_name.trim()) errors.first_name = 'First name is required'
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    if (!formData.password) errors.password = 'Password is required'
    if (formData.password !== formData.password2) {
      errors.password2 = 'Passwords do not match'
    }
    if (!agreedToTerms) errors.terms = 'You must agree to the terms'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    try {
      const response = await registerUser({
        email: formData.email.trim(),
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
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
        toast.success(response.message || 'Registration successful! Welcome to Sportsphere Academy.')
        navigate('/dashboard', { replace: true })
      } else {
        if (response.errors) {
          setFieldErrors(response.errors)
        }
        dispatch(setError(response.message || 'Registration failed'))
        toast.error(response.message || 'Registration failed')
      }
    } catch (err) {
      const errData = err.response?.data
      const message = errData?.message || err.message || 'Registration failed. Please try again.'

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
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500 rounded-full blur-[80px]" />
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
              Join the
              <span className="block bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-300 bg-clip-text text-transparent">
                Sportsphere Academy
              </span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Create your account and start your football journey. Access
              world-class training, expert coaching, and a community of champions.
            </p>

            {/* Feature highlights */}
            <div className="mt-10 space-y-4 text-left">
              {[
                { icon: '🎯', text: 'Personalized training programs' },
                { icon: '📊', text: 'Performance tracking & analytics' },
                { icon: '🏆', text: 'Compete with fellow athletes' },
                { icon: '👨‍🏫', text: '1-on-1 coaching sessions' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-300">
                  <span className="text-lg">{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
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
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
                <p className="text-gray-400 mt-1 text-sm">
                  Sign up to get started with Sportsphere Academy
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-6">
                <GoogleSignInButton text="Sign up with Google" />
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card/40 px-3 text-gray-500">or register with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-gray-300">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
                        fieldErrors.first_name ? 'border-destructive' : ''
                      }`}
                    />
                    {fieldErrors.first_name && (
                      <p className="text-xs text-destructive">{fieldErrors.first_name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-gray-300">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
                        fieldErrors.last_name ? 'border-destructive' : ''
                      }`}
                    />
                    {fieldErrors.last_name && (
                      <p className="text-xs text-destructive">{fieldErrors.last_name}</p>
                    )}
                  </div>
                </div>

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
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
                      fieldErrors.email ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
                      fieldErrors.password ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password2" className="text-gray-300">
                    Confirm Password
                  </Label>
                  <Input
                    id="password2"
                    name="password2"
                    type="password"
                    placeholder="Repeat your password"
                    value={formData.password2}
                    onChange={handleChange}
                    className={`bg-white/5 border-border/50 text-white placeholder:text-gray-500 h-10 ${
                      fieldErrors.password2 ? 'border-destructive' : ''
                    }`}
                  />
                  {fieldErrors.password2 && (
                    <p className="text-xs text-destructive">{fieldErrors.password2}</p>
                  )}
                </div>

                {/* Terms agreement */}
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-border/50 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                  />
                  <Label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-400 hover:text-blue-300">
                      Privacy Policy
                    </a>
                  </Label>
                </div>
                {fieldErrors.terms && (
                  <p className="text-xs text-destructive">{fieldErrors.terms}</p>
                )}

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
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

